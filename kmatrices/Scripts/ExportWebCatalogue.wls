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
  "TypeRanks" -> <|
    "A(1)" -> Range[2, 6],
    "B(1)" -> Range[2, 6],
    "C(1)" -> Range[2, 6],
    "D(1)" -> Range[4, 6],
    "A2n-1(2)" -> Range[3, 6],
    "A2n-1(2)T" -> Range[3, 6],
    "A2n(2)" -> Range[2, 6],
    "A2n(2)T" -> Range[2, 6],
    "Dn+1(2)" -> Range[2, 6]|>,
  "MaximumExactCertificationRank" -> 3,
  "IncludeKMatrices" -> True
];

If[!AssociationQ[manifest], Exit[1]];
Print["Exported ", Length[manifest["files"]], " catalogues to ", outputDirectory, "."];
