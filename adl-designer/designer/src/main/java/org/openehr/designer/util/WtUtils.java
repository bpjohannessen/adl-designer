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

package org.openehr.designer.util;

import com.google.common.collect.ImmutableSet;
import org.apache.commons.lang.CharSet;
import org.apache.commons.lang.SystemUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

/**
 * @author Marko Pipan
 */
public class WtUtils {
    public static final char FILENAME_ESCAPE_CHAR = '#';
    private static final CharSet EXTRA_VALID_CHARS = CharSet.getInstance("-=.,#$");

    private static DocumentBuilder documentBuilder;
    public static final Logger LOG = LoggerFactory.getLogger(WtUtils.class);


    static {
        try {
            DocumentBuilderFactory documentBuilderFactory = DocumentBuilderFactory.newInstance();
            documentBuilderFactory.setNamespaceAware(true);
            documentBuilder = documentBuilderFactory.newDocumentBuilder();
        } catch (Exception e) {
            LOG.error("Error initializing document builder", e);
        }
    }

    public static DocumentBuilder defaultDocumentBuilder() {
        return documentBuilder;
    }

    public static List<Element> children(Element parent) {
        List<Element> result = new ArrayList<>();
        NodeList childNodes = parent.getChildNodes();
        for (int i = 0; i < childNodes.getLength(); i++) {
            Node node = childNodes.item(i);
            if (node.getNodeType() == Node.ELEMENT_NODE) {
                result.add((Element) node);
            }
        }
        return result;
    }

    public static String overrideNodeId(String nodeId) {
        if (nodeId == null) return null;
        return nodeId + ".1";
    }

    public static String parentNodeId(String nodeId) {
        int pos = nodeId.lastIndexOf('.');
        return nodeId.substring(0, pos);
    }

    public static <T> Iterable<T> iterable(Iterator<T> iterator) {
        return () -> iterator;
    }

    public static <T> int indexOf(List<T> list, Predicate<T> predicate, int startIndex) {
        for (int i = startIndex; i < list.size(); i++) {
            T t = list.get(i);
            if (predicate.test(t)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Returns index of first element in list, or -1 if no predicate matches. Works like List.indexOf, but can
     * use any test condition.
     *
     * @param list list through which to search
     * @param predicate test condition
     * @param <T> type of list elements
     * @return index of the first matched item, or -1 if no item found
     */
    public static <T> int indexOf(List<T> list, Predicate<T> predicate) {
        return indexOf(list, predicate, 0);
    }

    public static String sanitizeFilename(String filename) {
        StringBuilder result = new StringBuilder();
        final int length = filename.length();
        for (int i = 0; i < length; i++) {
            char c = filename.charAt(i);
            if (c != FILENAME_ESCAPE_CHAR && isValidFilenameChar(c)) {
                result.append(c);
            } else {
                result.append(FILENAME_ESCAPE_CHAR).append(toUnicodeString(c));
            }
        }
        if (SystemUtils.IS_OS_WINDOWS) {
            if (ImmutableSet.of("con", "prn", "aux").contains(result.toString().toLowerCase())) {
                result.append(FILENAME_ESCAPE_CHAR);
            }
        }

        return result.toString();
    }

    private static String toUnicodeString(char c) {
        StringBuilder response = new StringBuilder();
        String resp = Integer.toHexString(c);
        for (int i = 0; i < 4 - resp.length(); i++) {
            response.append(0);
        }
        response.append(resp);
        return response.toString();
    }


    private static boolean isValidFilenameChar(char c) {
        if (Character.isJavaIdentifierPart(c)) return true;
        if (EXTRA_VALID_CHARS.contains(c)) return true;
        return false;
    }

    @SuppressWarnings("unchecked")
    public static <K, V> Map<K, V> uncheckedCast(Map<?, ?> map) {
        return (Map)map;
    }

}
