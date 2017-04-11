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

package org.openehr.designer.json;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.openehr.jaxb.am.*;

import java.util.List;

/**
 * @author Marko Pipan
 */
public class ArchetypeTerminologyMixin extends ArchetypeTerminology {

    @JsonDeserialize(converter = CodeDefinitionMapToListConverter.class)
    @JsonSerialize(converter = CodeDefinitionListToMapConverter.class)
    @Override
    public List<CodeDefinitionSet> getTermDefinitions() {
        return super.getTermDefinitions();
    }

    @JsonDeserialize(converter = CodeDefinitionMapToListConverter.class)
    @JsonSerialize(converter = CodeDefinitionListToMapConverter.class)
    @Override
    public List<CodeDefinitionSet> getConstraintDefinitions() {
        return super.getConstraintDefinitions();
    }

    @JsonDeserialize(converter = CodeDefinitionMapToListConverter.class)
    @JsonSerialize(converter = CodeDefinitionListToMapConverter.class)
    @Override
    public List<CodeDefinitionSet> getTerminologyExtracts() {
        return super.getTerminologyExtracts();
    }

    @JsonDeserialize(converter = TermBindingMapToListConverter.class)
    @JsonSerialize(converter = TermBindingListToMapConverter.class)
    @Override
    public List<TermBindingSet> getTermBindings() {
        return super.getTermBindings();
    }

    @JsonDeserialize(converter = ConstraintBindingMapToListConverter.class)
    @JsonSerialize(converter = ConstraintBindingListToMapConverter.class)
    @Override
    public List<ConstraintBindingSet> getConstraintBindings() {
        return super.getConstraintBindings();
    }

    @JsonDeserialize(converter = ValueSetMapToListConverter.class)
    @JsonSerialize(converter = ValueSetListToMapConverter.class)
    @Override
    public List<ValueSetItem> getValueSets() {
        return super.getValueSets();
    }
}
