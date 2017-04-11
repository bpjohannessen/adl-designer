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

package org.openehr.designer.rm;

import com.google.common.collect.Maps;
import org.openehr.adl.rm.RmModel;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

/**
 * @author markopi
 */
public class ReferenceModels {
    private final ConcurrentMap<String, ReferenceModel> nameToModelMap = Maps.newConcurrentMap();

    public ReferenceModels() {
    }

    public void addReferenceModel(String name, String version, RmModel referenceModel) {
        ReferenceModel model = nameToModelMap.computeIfAbsent(name, ReferenceModel::new);
        model.addVersion(version, referenceModel);
    }

    public List<ReferenceModelInfo> listModels() {
        return nameToModelMap.values().stream()
                .map(model -> new ReferenceModelInfo(model.name, model.latestVersion))
                .collect(Collectors.toList());
    }

    public RmModel getReferenceModel(String name, String version) {
        ReferenceModel model = nameToModelMap.get(name);
        if (model == null) throw new IllegalArgumentException("No reference model with name " + name);
        RmModel result = model.versionedModels.get(version);
        if (result == null)
            throw new IllegalArgumentException("No version " + version + " for reference model " + name);
        return result;
    }


    // todo remove this once proper reference model selection is implemented
    public RmModel getDefaultReferenceModel() {
        return getReferenceModel("openEHR", "1.0.2");
    }

    private static final class ReferenceModel {
        final String name;
        final Map<String, RmModel> versionedModels = Maps.newHashMap();
        String latestVersion;

        ReferenceModel(String name) {
            this.name = name;
        }

        void addVersion(String version, RmModel rmModel) {
            latestVersion = version;
            versionedModels.put(version, rmModel);
        }
    }
}
