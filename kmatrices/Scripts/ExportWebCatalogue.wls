#!/usr/bin/env wolframscript

projectRoot = DirectoryName[DirectoryName[$InputFileName]];
Get[FileNameJoin[{projectRoot, "Kernel", "QREKMatrices.wl"}]];

outputDirectory = If[Length[$ScriptCommandLine] >= 2,
  ExpandFileName[$ScriptCommandLine[[2]]],
  FileNameJoin[{projectRoot, "apps", "web", "public", "catalogue"}]
];

manifest = ExportWebCatalogue[outputDirectory,
  "Types" -> AffineTypes[],
  "Ranks" -> {2, 3, 4},
  "IncludeKMatrices" -> True
];

If[!AssociationQ[manifest], Exit[1]];
Print["Exported ", Length[manifest["files"]], " catalogues to ", outputDirectory, "."];
