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

import org.openehr.adl.FlatArchetypeProvider;
import org.openehr.adl.rm.RmModel;
import org.openehr.jaxb.am.Archetype;

import java.util.ArrayList;
import java.util.List;

/**
 * @author markopi
 */
public class TemplateDifferentiator {
    private final FlatArchetypeProvider flatArchetypeProvider;

    public TemplateDifferentiator(FlatArchetypeProvider flatArchetypeProvider) {
        this.flatArchetypeProvider = flatArchetypeProvider;
    }

    public List<Archetype> differentiate(RmModel rmModel, List<Archetype> flatTemplateArchetypes) {
        List<Archetype> result = new ArrayList<>();
        for (Archetype flatArchetype : flatTemplateArchetypes) {
            Archetype flatArchetypeParent = null;
            if (flatArchetype.getParentArchetypeId() != null) {
                flatArchetypeParent = flatArchetypeProvider.getFlatArchetype(flatArchetype.getParentArchetypeId().getValue());
            }
            Archetype differentialArchetype = ArchetypeDifferentiator.differentiate(rmModel, flatArchetypeParent, flatArchetype);
            result.add(differentialArchetype);
        }
//        removeUnchangedArchetypes(result);
        return result;
    }

//    private void removeUnchangedArchetypes(List<DifferentialArchetype> archetypes) {
//        int archetypeIndex = 0;
//        while (archetypeIndex < archetypes.size()) {
//            DifferentialArchetype archetype = archetypes.get(archetypeIndex);
//
//            if (archetype.isIsOverlay() && !isArchetypeChanged(archetype)) {
//                archetypes.remove(archetypeIndex);
//                removeReferencesToArchetype(archetypes, archetype.getArchetypeId().getValue(), archetype.getParentArchetypeId().getValue());
//            } else {
//                archetypeIndex++;
//            }
//        }
//
//    }
//
//    private boolean isArchetypeChanged(DifferentialArchetype archetype) {
//        if (!archetype.getDefinition().getAttributes().isEmpty()) return true;
//        if (!archetype.getTerminology().getValueSets().isEmpty()) return true;
//
//        FlatArchetype parent = flatArchetypeProvider.getFlatArchetype(archetype.getParentArchetypeId().getValue());
//
//
//        ArchetypeWrapper wrapper = new ArchetypeWrapper(archetype);
//        ArchetypeWrapper parentWrapper = new ArchetypeWrapper(parent);
//
//        if (isTermRedefinedForLanguage(
//                wrapper, parentWrapper, parent.getOriginalLanguage().getCodeString())) {
//            return true;
//        }
//        for (TranslationDetails translation : parent.getTranslations()) {
//            if (isTermRedefinedForLanguage(
//                    wrapper, parentWrapper, translation.getLanguage().getCodeString())) {
//                return true;
//            }
//        }
//
//        return false;
//    }
//
//    private boolean isTermRedefinedForLanguage(ArchetypeWrapper wrapper, ArchetypeWrapper parentWrapper, String language) {
//        String mainNodeId = wrapper.getArchetype().getDefinition().getNodeId();
//        String parentNodeId = parentWrapper.getArchetype().getDefinition().getNodeId();
//
//        Map<String, String> specializedTerm = wrapper.getTerm(language, mainNodeId);
//        Map<String, String> parentTerm = parentWrapper.getTerm(language, parentNodeId);
//        if (specializedTerm != null && !specializedTerm.equals(parentTerm)) return true;
//        return false;
//    }
//
//    private void removeReferencesToArchetype(List<DifferentialArchetype> archetypes, String overlayArchetypeId, String parentArchetypeId) {
//        for (DifferentialArchetype archetype : archetypes) {
//            ArchetypeWalker.walkConstraints(new ConstraintAmVisitor<>()
//                            .add(CArchetypeRoot.class, AmVisitors.preorder((item, AmVisitContext) -> {
//                                if (overlayArchetypeId.equals(item.getArchetypeRef())) {
//                                    item.setArchetypeRef(parentArchetypeId);
//                                }
//                                if (overlayArchetypeId.equals(item.getNodeId())) {
//                                    item.setNodeId(parentArchetypeId);
//                                }
//                                return ArchetypeWalker.Action.next();
//                            })),
//                    archetype, new AmConstraintContext());
//        }
//    }


}
