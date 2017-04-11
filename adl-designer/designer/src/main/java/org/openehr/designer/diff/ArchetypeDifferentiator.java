/*
 * ADL Designer
 * Copyright (c) 2013-2014 Marand d.o.o. (www.marand.com)
 *
 * This file is part of ADL2-tools.
 *
 * ADL2-tools is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.openehr.designer.diff;

import org.apache.commons.lang.SerializationUtils;
import org.openehr.adl.FlatArchetypeProvider;
import org.openehr.adl.am.mixin.AmMixins;
import org.openehr.adl.am.mixin.MultiplicityIntervalMixin;
import org.openehr.adl.rm.*;
import org.openehr.adl.util.AdlUtils;
import org.openehr.adl.util.ArchetypeWrapper;
import org.openehr.jaxb.am.*;
import org.openehr.jaxb.rm.MultiplicityInterval;

import javax.annotation.Nullable;
import java.util.*;
import java.util.stream.Collectors;

import static com.google.common.base.Preconditions.checkArgument;
import static org.openehr.adl.rm.RmObjectFactory.newMultiplicityInterval;
import static org.openehr.designer.diff.NodeIdDifferentiator.getSpecializationDepth;



/**
 * @author markopi
 */
public class ArchetypeDifferentiator {
    private final RmModel rmModel;
    private final Archetype flatParent;
    private final Archetype flatChild;
    private final ArchetypeWrapper flatParentWrapper;
    private final int archetypeSpecializationDepth;

    private ArchetypeDifferentiator(RmModel rmModel, @Nullable Archetype flatParent, Archetype flatChild) {
        checkArgument(flatParent == null || !flatParent.isIsDifferential(), "flatParent: must be a flat archetype or null");
        checkArgument(!flatChild.isIsDifferential(), "flatChild: must be a flat archetype");

        this.rmModel = rmModel;
        this.flatParent = flatParent;
        this.flatChild = flatChild;
        this.flatParentWrapper = flatParent != null ? new ArchetypeWrapper(flatParent) : null;
        this.archetypeSpecializationDepth = getSpecializationDepth(flatChild.getDefinition().getNodeId());
    }

    public static Archetype differentiate(RmModel rmModel, FlatArchetypeProvider flatArchetypeProvider, Archetype flatChild) {
        Archetype flatParent = null;
        if (flatChild.getParentArchetypeId() != null && flatChild.getParentArchetypeId().getValue() != null) {
            flatParent = flatArchetypeProvider.getFlatArchetype(flatChild.getParentArchetypeId().getValue());
        }
        return differentiate(rmModel, flatParent, flatChild);
    }

    public static Archetype differentiate(RmModel rmModel, @Nullable Archetype flatParent, Archetype flatChild) {
        return new ArchetypeDifferentiator(rmModel, flatParent, flatChild).build();
    }

    private Archetype build() {
        Archetype diffChild = AdlUtils.createDifferentialArchetypeClone(flatChild);
        removeUnspecializedOccurrences(null, diffChild.getDefinition());

        if (flatParent == null) {
            return diffChild; // no differentiation needed
        }
        pruneUnspecializedNodes(flatParent.getDefinition(), diffChild.getDefinition());

        makeDifferentialPaths(diffChild.getDefinition());

        removeUnspecializedTermDefinitions(diffChild);
        removeUnspecializedTermBindings(diffChild);
        removeUnspecializedValueSets(diffChild);


        return diffChild;
    }

    private void removeUnspecializedOccurrences(@Nullable CAttribute parentCAttr, CObject specialized) {
        removeUnspecializedCObjectOccurrences(parentCAttr, specialized);
        if (!(specialized instanceof CComplexObject)) return;
        CComplexObject specializedCont = (CComplexObject) specialized;

        for (CAttribute cAttribute : specializedCont.getAttributes()) {
            cAttribute.getChildren().stream()
                    .forEach(cObject -> removeUnspecializedOccurrences(cAttribute, cObject));

            RmTypeAttribute rmAttribute;
            try {
                rmAttribute = rmModel.getRmAttribute(specialized.getRmTypeName(), cAttribute.getRmAttributeName());
            } catch (RmModelException e) {
                // no attribute, do nothing
                continue;
            }
            if (cAttribute.getExistence() != null && !Objects.equals(cAttribute.getExistence().getLower(), rmAttribute.getExistence().getLower())) {
                cAttribute.setExistence(null);
            }
            if (cAttribute.getCardinality() != null) {
                RmCardinality card = new RmCardinality(cAttribute.getCardinality().isIsOrdered(),
                        cAttribute.getCardinality().isIsUnique(),
                        new RmMultiplicity(
                                cAttribute.getCardinality().getInterval().getLower(),
                                cAttribute.getCardinality().getInterval().getUpper())
                );
                if (card.equals(rmAttribute.getCardinality())) {
                    cAttribute.setCardinality(null);
                }
            }
        }

    }

    private void removeUnspecializedCObjectOccurrences(@Nullable CAttribute parentCAttr, CObject specialized) {
        if (specialized.getOccurrences() != null) {
            MultiplicityIntervalMixin specializedMixin = AmMixins.of(specialized.getOccurrences());
            CObject parent = findCObject(parentCAttr, specialized.getNodeId());

            if (parentCAttr == null) {
                specialized.setOccurrences(null);
            } else if (parent!=null && parent.getOccurrences()!=null) {
                if (specializedMixin.isEqualTo(parent.getOccurrences())) {
                    specialized.setOccurrences(null);
                }
            } else if (parentCAttr.getCardinality() == null) {
                if (specializedMixin.isEqualTo(parentCAttr.getExistence())) {
                    specialized.setOccurrences(null);
                }
            } else {
                if (specializedMixin.isEqualTo(parentCAttr.getCardinality().getInterval())) {
                    specialized.setOccurrences(null);
                }
            }
        }
    }


    private void removeUnspecializedValueSets(Archetype diffChild) {

        for (Iterator<ValueSetItem> iterator = diffChild.getTerminology().getValueSets().iterator(); iterator.hasNext(); ) {
            ValueSetItem valueSetItem = iterator.next();
            List<String> parentMembers = flatParentWrapper.getValueSet(valueSetItem.getId());
            if (parentMembers != null && parentMembers.equals(valueSetItem.getMembers())) {
                iterator.remove();
            }
        }

    }

    private void removeUnspecializedTermDefinitions(Archetype diffChild) {
        ArchetypeWrapper diffChildWrapper = new ArchetypeWrapper(diffChild);
        List<String> languages = diffChild.getTerminology().getTermDefinitions().stream()
                .map(CodeDefinitionSet::getLanguage)
                .collect(Collectors.toList());

        if (diffChild.getTerminology().getTermDefinitions().isEmpty()) return;
        List<String> termIds = diffChild.getTerminology().getTermDefinitions().get(0).getItems().stream()
                .map(ArchetypeTerm::getCode)
                .collect(Collectors.toList());

        Set<String> termsToKeep = new HashSet<>();

        termLoop:
        for (String termId : termIds) {
            if (getSpecializationDepth(termId) == archetypeSpecializationDepth) {
                termsToKeep.add(termId);
                continue;
            }
            for (String language : languages) {
                Map<String, String> diffTerm = diffChildWrapper.getTerm(language, termId);
                Map<String, String> parentTerm = flatParentWrapper.getTerm(language, termId);
                if (diffTerm != null && !diffTerm.equals(parentTerm)) {
                    termsToKeep.add(termId);
                    continue termLoop;
                }
            }
        }

        for (CodeDefinitionSet codeDefinitionSet : diffChild.getTerminology().getTermDefinitions()) {
            for (Iterator<ArchetypeTerm> iterator = codeDefinitionSet.getItems().iterator(); iterator.hasNext(); ) {
                ArchetypeTerm at = iterator.next();
                if (!termsToKeep.contains(at.getCode())) {
                    iterator.remove();
                }
            }
        }
    }

    private void removeUnspecializedTermBindings(Archetype diffChild) {
        if (diffChild.getTerminology().getTermBindings().isEmpty()) return;

        for (Iterator<TermBindingSet> tbsIterator = diffChild.getTerminology().getTermBindings().iterator(); tbsIterator.hasNext(); ) {
            TermBindingSet termBindingSet = tbsIterator.next();
            for (Iterator<TermBindingItem> tbiIterator = termBindingSet.getItems().iterator(); tbiIterator.hasNext(); ) {
                TermBindingItem termBindingItem = tbiIterator.next();
                try {
                    if (getSpecializationDepth(termBindingItem.getCode()) == archetypeSpecializationDepth) continue;
                } catch (IllegalArgumentException e) {
                    RmPath path = RmPath.valueOf(termBindingItem.getCode());
                    if (getSpecializationDepth(path.getNodeId()) == archetypeSpecializationDepth) continue;
                }
                if (Objects.equals(
                        termBindingItem.getValue(),
                        flatParentWrapper.getTerminologyBinding(termBindingSet.getTerminology(), termBindingItem.getCode()))) {
                    tbiIterator.remove();
                }
            }
            if (termBindingSet.getItems().isEmpty()) {
                tbsIterator.remove();
            }

        }
    }

    private void makeDifferentialPaths(CObject cobject) {
        if (!(cobject instanceof CComplexObject)) return;
        CComplexObject cobj = (CComplexObject) cobject;
        for (CAttribute cAttribute : cobj.getAttributes()) {
            makeDifferentialPaths(cAttribute);
        }
    }

    private void makeDifferentialPaths(CAttribute cattr) {
        cattr.getChildren().forEach(this::makeDifferentialPaths);
        if (isIntermediate(cattr)) {
            CComplexObject cchild = (CComplexObject) cattr.getChildren().get(0);
            CAttribute cChildAttr = cchild.getAttributes().get(0);
            if (cChildAttr.getDifferentialPath() == null) {
                cattr.setDifferentialPath("/" + cattr.getRmAttributeName() + "[" + cchild.getNodeId() + "]/"
                        + cChildAttr.getRmAttributeName());
            } else {
                cattr.setDifferentialPath("/" + cattr.getRmAttributeName() + "[" + cchild.getNodeId() + "]"
                        + cChildAttr.getDifferentialPath());
            }
            cattr.setRmAttributeName(null);
            cattr.getChildren().clear();
            cattr.getChildren().addAll(cChildAttr.getChildren());
        }

    }

    private boolean isIntermediate(CAttribute cattr) {
        if (cattr.getChildren().size() != 1) return false;
        if (!isIntermediate(cattr.getChildren().get(0))) return false;
        return true;

    }

    private boolean isIntermediate(CObject cobject) {
        if (!(cobject instanceof CComplexObject)) return false;
        CComplexObject cobj = (CComplexObject) cobject;
        if (!cobj.getAttributeTuples().isEmpty()) return false;
        if (cobj.getNodeId() == null) return false;
        int nodeSpecializationDepth = NodeIdDifferentiator.getSpecializationDepth(cobj.getNodeId());
        if (nodeSpecializationDepth == archetypeSpecializationDepth) return false;
        if (cobj.getAttributes().size() != 1) return false;
        return true;
    }

    /**
     * Prune nodes that are not specialized and do not have any specialized children. Allows node_id==null on children
     * of specialized nodes.
     *
     * @param cobj object to check
     * @return prune if the object should be removed, keep if it should be kept, undetermined if it not known yet
     */
    private Prune pruneUnspecializedNodes(@Nullable CObject flatParent, CObject cobj) {
        Prune result = Prune.undetermined;
        if (cobj instanceof CComplexObject) {
            CComplexObject cComplexObject = (CComplexObject) cobj;
            for (Iterator<CAttribute> attrIterator = cComplexObject.getAttributes().iterator(); attrIterator.hasNext(); ) {
                CAttribute attribute = attrIterator.next();
                CAttribute parentAttribute = findParentAttribute(flatParent, attribute.getRmAttributeName());

                for (Iterator<CObject> childIterator = attribute.getChildren().iterator(); childIterator.hasNext(); ) {
                    CObject childConstraint = childIterator.next();
                    Prune pruneChild = pruneUnspecializedNodes(findParentConstraint(parentAttribute, childConstraint), childConstraint);
                    if (pruneChild == Prune.prune) {
                        childIterator.remove();
                    } else if (pruneChild == Prune.keep) {
                        differentiateCObject(findCObject(parentAttribute, childConstraint.getNodeId()), childConstraint);
                        result = Prune.keep;
                    }
                }

                if (attribute.getChildren().isEmpty()) {
                    if (!isAttributeSpecialized(flatParent, parentAttribute, attribute)) {
                        attrIterator.remove();
                    }
                }
            }
        }
        if (result != Prune.undetermined) {
            return result;
        }

        boolean isCObjectSpecialized = isCObjectSpecialized(flatParent, cobj);
        if (isCObjectSpecialized) {
            result = Prune.keep;
        } else {
            result = Prune.prune;
        }

        return result;
    }

    private void differentiateCObject(@Nullable CObject flatParent, CObject cobj) {
        if (flatParent==null) return;
        if (cobj instanceof ArchetypeSlot) {
            differentiateArchetypeSlot((ArchetypeSlot)flatParent, (ArchetypeSlot) cobj);
        }
    }

    private void differentiateArchetypeSlot(ArchetypeSlot flatParent, ArchetypeSlot cobj) {
        if (cobj.isIsClosed()!=null && cobj.isIsClosed()) {
            cobj.getIncludes().clear();
            cobj.getExcludes().clear();
        }
    }

    private boolean isCObjectSpecialized(CObject flatParent, CObject cobj) {
        if (cobj.getNodeId() == null) return true;
        if (cobj.getNodeId().startsWith("openEHR-")) return true;
        int nodeSpecializationDepth = getSpecializationDepth(cobj.getNodeId());
        if (nodeSpecializationDepth >= archetypeSpecializationDepth) {
            return true;
        }

        if (cobj instanceof ArchetypeSlot) {
            return isArchetypeSlotSpecialized((ArchetypeSlot) flatParent, (ArchetypeSlot) cobj);
        }
        return false;

    }

    private boolean isArchetypeSlotSpecialized(ArchetypeSlot flatParent, ArchetypeSlot cobj) {
        return !Arrays.equals(SerializationUtils.serialize(flatParent), SerializationUtils.serialize(cobj));
    }

    @Nullable
    private CObject findParentConstraint(CAttribute parentAttribute, CObject childConstraint) {
        if (parentAttribute == null) return null;
        String id = childConstraint.getNodeId();
        if (id == null) return null;

        CObject result = null;

        int lastIndexOf = id.lastIndexOf('.');

        if (lastIndexOf >= 0) {
            String parentNodeId = id.substring(0, lastIndexOf);
            result = findCObject(parentAttribute, parentNodeId);
        }
        if (result == null) {
            result = findCObject(parentAttribute, id);
        }
        return result;
    }

    @Nullable
    private CObject findCObject(CAttribute parentAttribute, String nodeId) {
        if (parentAttribute==null || nodeId==null) return null;
        for (CObject cObject : parentAttribute.getChildren()) {
            if (nodeId.equals(cObject.getNodeId())) {
                return cObject;
            }
        }
        return null;
    }

    @Nullable
    private CAttribute findParentAttribute(CObject flatParent, String rmAttributeName) {
        if (!(flatParent instanceof CComplexObject)) return null;
        CComplexObject p = (CComplexObject) flatParent;
        for (CAttribute pa : p.getAttributes()) {
            if (pa.getRmAttributeName().equals(rmAttributeName)) {
                return pa;
            }
        }
        return null;
    }

    private boolean isAttributeSpecialized(CObject parentsParent, CAttribute parentAttribute, CAttribute attribute) {
        if (parentsParent == null || parentAttribute == null) return true;

        MultiplicityInterval parentExistence = parentAttribute.getExistence();
        if (parentExistence == null) {
            RmTypeAttribute rmAttr = rmModel.getRmAttribute(parentsParent.getRmTypeName(), attribute.getRmAttributeName());
            parentExistence = toExistence(rmAttr);
        }

        if (isExistenceSpecialized(parentExistence, attribute.getExistence())) return true;
        return false;
    }

    private MultiplicityInterval toExistence(RmTypeAttribute rmAttr) {
        return newMultiplicityInterval(rmAttr.getExistence().getLower(), rmAttr.getExistence().getUpper());
    }

    private boolean isExistenceSpecialized(MultiplicityInterval parentExistence, MultiplicityInterval existence) {
        if (existence == null) return false;
        if (parentExistence == null) return true;
        if (!Objects.equals(parentExistence.getLower(), existence.getLower()) ||
                !Objects.equals(parentExistence.getUpper(), existence.getUpper())) {
            return true;
        }
        return false;
    }
    private enum Prune {
        prune,
        keep,
        undetermined
    }
}
