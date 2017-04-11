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

import com.google.common.base.Joiner;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author markopi
 */
public class NodeIdDifferentiator {
    private static final Pattern PREFIX_PATTER = Pattern.compile("([a-zA-Z]+)([\\d\\.]+)");

    public static int getSpecializationDepth(String nodeId) {
        if (nodeId.startsWith("openEHR-")) {
            return 0;
        }
        return NodeId.parse(nodeId).codes.length;
    }

    private static class NodeId {
        String prefix;
        String[] codes;

        public static NodeId parse(String nodeId) {
            NodeId result = new NodeId();
            Matcher m = PREFIX_PATTER.matcher(nodeId);
            if (!m.matches()) throw new IllegalArgumentException(nodeId);
            result.prefix = m.group(1);
            result.codes = m.group(2).split("\\.");
            return result;
        }

        @Override
        public String toString() {
            return prefix + Joiner.on(".").join(codes);
        }
    }
}
