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

import com.fasterxml.jackson.databind.util.StdConverter;
import org.openehr.jaxb.am.ConstraintBindingItem;
import org.openehr.jaxb.am.ConstraintBindingSet;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.openehr.adl.am.AmObjectFactory.newConstraintBindingItem;

/**
 * @author Marko Pipan
 */
public class ConstraintBindingMapToListConverter extends StdConverter<Map, List> {
    @Override
    public List convert(Map value) {
        Map<String, Map<String, String>> from = value;
        List<ConstraintBindingSet> result = new ArrayList<>();
        for (Map.Entry<String, Map<String, String>> cbsEntry : from.entrySet()) {
            ConstraintBindingSet cbs = new ConstraintBindingSet();
            cbs.setTerminology(cbsEntry.getKey());
            addCbsItems(cbs.getItems(), cbsEntry.getValue());
        }
        return result;
    }

    private void addCbsItems(List<ConstraintBindingItem> target, Map<String, String> cbiMap) {
        for (Map.Entry<String, String> cbiEntry : cbiMap.entrySet()) {
            target.add(newConstraintBindingItem(cbiEntry.getKey(), cbiEntry.getValue()));
        }
    }
}
