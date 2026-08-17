packageRoot = DirectoryName[DirectoryName[$TestFileName]];
Get[FileNameJoin[{packageRoot, "Kernel", "QREKMatrices.wl"}]];

VerificationTest[
  TwistedAffineTypes[],
  {"A2n-1(2)", "A2n-1(2)T", "A2n(2)", "A2n(2)T", "Dn+1(2)"},
  TestID -> "supported-types"
]

VerificationTest[
  AffineTypes[],
  {"A(1)", "B(1)", "C(1)", "D(1)",
    "A2n-1(2)", "A2n-1(2)T", "A2n(2)", "A2n(2)T", "Dn+1(2)"},
  TestID -> "all-affine-types"
]

VerificationTest[
  Module[{specs, a, d},
    specs = {{"A(1)", 2}, {"B(1)", 2}, {"C(1)", 2}, {"D(1)", 4},
      {"A2n-1(2)", 3}, {"A2n-1(2)T", 3}, {"A2n(2)", 2},
      {"A2n(2)T", 2}, {"Dn+1(2)", 2}};
    And @@ Table[
      a = CartanMatrixOf @@ spec;
      d = DiagonalMatrix[SymmetrizersOf @@ spec];
      d.a === Transpose[d.a],
      {spec, specs}
    ]
  ],
  True,
  TestID -> "all-cartans-symmetrize"
]

VerificationTest[
  CartanMatrixOf["A2n(2)", 2],
  {{2, -1, 0}, {-2, 2, -1}, {0, -2, 2}},
  TestID -> "A4-twisted-cartan"
]

VerificationTest[
  CartanMatrixOf["A2n-1(2)T", 3],
  Reverse[Reverse[CartanMatrixOf["A2n-1(2)", 3]], 2],
  TestID -> "reversed-cartan"
]

VerificationTest[
  SatakeDiagramQ[CreateSatakeDiagram["A2n(2)", 2, {}, Automatic]],
  True,
  TestID -> "all-white-diagram"
]

VerificationTest[
  FailureQ[CreateSatakeDiagram["A2n-1(2)", 3, {2}, Automatic]],
  True,
  {CreateSatakeDiagram::invalid},
  TestID -> "forbidden-isolated-A2-component"
]

VerificationTest[
  And @@ (SatakeDiagramQ /@ GeneralizedSatakeDiagrams["A2n(2)", 2]),
  True,
  TestID -> "enumerated-diagrams-validate"
]

VerificationTest[
  And @@ (SatakeDiagramQ /@ GeneralizedSatakeDiagrams["A(1)", 2]),
  True,
  TestID -> "untwisted-enumerated-diagrams-validate"
]

VerificationTest[
  Module[{diagrams},
    diagrams = {
      CreateSatakeDiagram["A(1)", 2, {}],
      CreateSatakeDiagram["A(1)", 3, {1, 3}],
      CreateSatakeDiagram["A(1)", 3, {}, {2, 3, 0, 1}],
      CreateSatakeDiagram["A(1)", 4, {}, {0, 4, 3, 2, 1}]
    };
    {Lookup[ClassifySatakeDiagram /@ diagrams, "Family"],
      BoundaryEquationType /@ diagrams,
      ClassifySatakeDiagram[Last[diagrams]]["Parameters"]}
  ],
  {{"A.1", "A.2", "A.4", "A.3"},
    {"Transposed", "Transposed", "Transposed", "Standard"},
    <|"l" -> 0, "r" -> 2, "t" -> 5|>},
  TestID -> "classify-all-A-families"
]

VerificationTest[
  Module[{d, classification, result},
    d = CreateSatakeDiagram["B(1)", 3, {}];
    classification = ClassifySatakeDiagram[d];
    result = KMatrix[d, u];
    {classification["Family"], classification["Parameters"],
      classification["ClassificationStatus"], result["Family"]}
  ],
  {"B.1", <|"l" -> 0, "r" -> 3|>, "Classified", "B.1"},
  TestID -> "plain-family-is-classified"
]

VerificationTest[
  Module[{plain, alternating, overlap, parallel},
    plain = ClassifySatakeDiagram[
      CreateSatakeDiagram["C(1)", 4, {0, 4}]];
    alternating = ClassifySatakeDiagram[
      CreateSatakeDiagram["C(1)", 4, {1, 3}]];
    overlap = ClassifySatakeDiagram[
      CreateSatakeDiagram["C(1)", 4, {0, 1, 3, 4}]];
    parallel = ClassifySatakeDiagram[
      CreateSatakeDiagram["C(1)", 4, {2}, {4, 3, 2, 1, 0}]];
    {plain["Family"], plain["Parameters"],
      alternating["Family"], alternating["Parameters"],
      overlap["CandidateFamilies"], parallel["Family"],
      parallel["Parameters"]}
  ],
  {"C.1", <|"l" -> 1, "r" -> 3|>,
    "C.2", <|"l" -> 0, "r" -> 4|>,
    {"C.1", "C.2"}, "C.4", <|"l" -> 1|>},
  TestID -> "classify-C-plain-alternating-parallel"
]

VerificationTest[
  Module[{nonstandard, exceptional},
    nonstandard = ClassifySatakeDiagram[
      CreateSatakeDiagram["C(1)", 5, {0, 1, 5}]];
    exceptional = ClassifySatakeDiagram[
      CreateSatakeDiagram["D(1)", 4, {}, {0, 4, 2, 3, 1}]];
    {nonstandard["Family"], nonstandard["Parameters"],
      nonstandard["ClassificationStatus"], nonstandard["Regime"],
      exceptional["Family"], exceptional["Regime"]}
  ],
  {"C.1", <|"l" -> 2, "r" -> 4|>,
    "ClassifiedNonQuasistandard", "NonQuasistandard",
    "D.3", "NoVectorKMatrix"},
  TestID -> "classify-nonquasistandard-and-D3"
]

VerificationTest[
  Module[{specs, diagrams},
    specs = {{"B(1)", 3}, {"C(1)", 3}, {"D(1)", 4},
      {"A2n-1(2)", 3}, {"A2n-1(2)T", 3}, {"A2n(2)", 3},
      {"A2n(2)T", 3}, {"Dn+1(2)", 3}};
    And @@ Table[
      diagrams = GeneralizedSatakeDiagrams[spec[[1]], spec[[2]]];
      And @@ (Lookup[ClassifySatakeDiagram[#], "CandidateFamilies", {}] =!= {} & /@
        diagrams),
      {spec, specs}
    ]
  ],
  True,
  TestID -> "all-enumerated-non-A-diagrams-have-family-candidates"
]

VerificationTest[
  Module[{nonstandard, exceptional},
    nonstandard = CreateSatakeDiagram["C(1)", 5, {0, 1, 5}];
    exceptional = CreateSatakeDiagram["D(1)", 4, {}, {0, 4, 2, 3, 1}];
    {FailureQ[Quiet[KMatrix[nonstandard, u], KMatrix::nonquasi]],
      FailureQ[Quiet[KMatrix[exceptional, u], KMatrix::novector]]}
  ],
  {True, True},
  TestID -> "unsafe-catalogue-regimes-are-guarded"
]

VerificationTest[
  Module[{rows, statuses, computed},
    rows = KMatrixTable["A2n-1(2)", 3, u];
    statuses = Lookup[rows, "Status"];
    computed = KMatrixTable["A2n-1(2)", 3, u,
      "ComputedOnly" -> True];
    {Length[rows], Length[computed],
      AllTrue[computed, #["Status"] === "Computed" &],
      ContainsAll[statuses, {"Computed", "MultipleCandidates",
        "NonQuasistandardFormulaRequired"}]}
  ],
  {14, 9, True, True},
  TestID -> "batch-K-matrix-table-preserves-all-diagrams-and-statuses"
]

VerificationTest[
  Module[{diagram, candidates, inference, parameterData},
    diagram = CreateSatakeDiagram["A2n-1(2)", 3, {0, 1, 3}];
    candidates = KMatrixCandidates[diagram, u, "QuantumParameter" -> 2];
    {Lookup[candidates, "Family"],
      And @@ Table[
        inference = InferCoidealParameters[
          candidate["Result", "KMatrix"], diagram, u, 2,
          "Equation" -> candidate["Result", "Equation"]];
        If[FailureQ[inference], False,
          parameterData = First[inference["ParameterData"]];
          VerifyKMatrix[candidate["Result", "KMatrix"], diagram, u, 2,
            parameterData["CParameters"], parameterData["SParameters"],
            "Equation" -> inference["Equation"]]
        ],
        {candidate, candidates}
      ]}
  ],
  {{"B*.1", "B*.2"}, True},
  TestID -> "ambiguous-family-candidates-are-returned-and-verified"
]

VerificationTest[
  Module[{cases, diagram, result},
    cases = {{"C(1)", 4, "C.1"}, {"C(1)", 4, "C.2"},
      {"C(1)", 4, "C.4"}, {"A2n(2)", 3, "C**.1"},
      {"A2n(2)", 3, "C**.2"}, {"Dn+1(2)", 3, "C*.4"}};
    And @@ Table[
      diagram = FirstCase[
        GeneralizedSatakeDiagrams[case[[1]], case[[2]]],
        candidate_ /; ClassifySatakeDiagram[candidate]["Family"] === case[[3]]];
      result = KMatrix[diagram, u, "QuantumParameter" -> 4];
      AssociationQ[result] && MatrixQ[result["KMatrix"]] &&
        result["Family"] === case[[3]],
      {case, cases}
    ]
  ],
  True,
  TestID -> "diagram-to-catalogue-non-A-families"
]

VerificationTest[
  Module[{d, result},
    d = CreateSatakeDiagram["A(1)", 4, {}, {0, 4, 3, 2, 1}];
    result = KMatrix[d, u];
    {result["Family"], result["Equation"], Dimensions[result["KMatrix"]],
      Together[Normal[result["KMatrix"]] /. u -> 1] === IdentityMatrix[5]}
  ],
  {"A.3", "Standard", {5, 5}, True},
  TestID -> "diagram-to-catalogue-A3"
]

VerificationTest[
  Module[{diagrams, parameterData, matrix},
    diagrams = {
      CreateSatakeDiagram["A(1)", 2, {}],
      CreateSatakeDiagram["A(1)", 3, {1, 3}],
      CreateSatakeDiagram["A(1)", 3, {}, {2, 3, 0, 1}]
    };
    And @@ Table[
      parameterData = CanonicalCoidealParameters[d, 4];
      matrix = KMatrix[d, u, "QuantumParameter" -> 4]["KMatrix"];
      VerifyKMatrix[matrix, d, u, 4,
        parameterData["CParameters"], parameterData["SParameters"],
        "Equation" -> parameterData["Equation"]],
      {d, diagrams}
    ]
  ],
  True,
  TestID -> "canonical-A-family-end-to-end"
]

VerificationTest[
  Module[{cases, diagram, parameters, matrix},
    cases = {
      {CreateSatakeDiagram["B(1)", 3, {}], <||>},
      {CreateSatakeDiagram["B(1)", 4, {1, 3}], <||>},
      {CreateSatakeDiagram["C(1)", 4, {}], <||>},
      {CreateSatakeDiagram["C(1)", 4, {1, 3}], <||>},
      {CreateSatakeDiagram["C(1)", 4, {2}, {4, 3, 2, 1, 0}],
        <|"Lambda" -> 3|>},
      {CreateSatakeDiagram["D(1)", 5, {}], <||>},
      {CreateSatakeDiagram["D(1)", 5, {1, 3}, {0, 1, 2, 3, 5, 4}], <||>},
      {CreateSatakeDiagram["D(1)", 5, {}, {5, 4, 3, 2, 1, 0}], <||>}
    };
    And @@ Table[
      diagram = case[[1]];
      parameters = CanonicalCoidealParameters[diagram, 2,
        "Parameters" -> case[[2]]];
      matrix = KMatrix[diagram, u, "QuantumParameter" -> 2,
        "Parameters" -> case[[2]]]["KMatrix"];
      AssociationQ[parameters] &&
        FreeQ[{parameters["CParameters"], parameters["SParameters"]}, u] &&
        VerifyKMatrix[matrix, diagram, u, 2,
          parameters["CParameters"], parameters["SParameters"],
          "Equation" -> parameters["Equation"]],
      {case, cases}
    ]
  ],
  True,
  TestID -> "inferred-untwisted-canonical-parameters"
]

VerificationTest[
  Module[{cases, diagram, boundary, matrix},
    cases = {
      {CreateSatakeDiagram["A2n-1(2)", 3, {}], <||>},
      {CreateSatakeDiagram["A2n-1(2)", 3, {1, 3}], <||>},
      {CreateSatakeDiagram["A2n-1(2)T", 3, {}], <||>},
      {CreateSatakeDiagram["A2n-1(2)T", 3, {0, 2}], <||>},
      {CreateSatakeDiagram["A2n(2)", 3, {}], <||>},
      {CreateSatakeDiagram["A2n(2)", 3, {0, 2}], <||>},
      {CreateSatakeDiagram["A2n(2)T", 3, {}], <||>},
      {CreateSatakeDiagram["A2n(2)T", 3, {0, 2}], <||>},
      {CreateSatakeDiagram["Dn+1(2)", 3, {}], <||>},
      {CreateSatakeDiagram["Dn+1(2)", 3, {0, 2}], <||>},
      {CreateSatakeDiagram["Dn+1(2)", 3, {}, {3, 2, 1, 0}], <||>}
    };
    And @@ Table[
      diagram = case[[1]];
      boundary = CanonicalCoidealParameters[diagram, 2,
        "Parameters" -> case[[2]]];
      matrix = KMatrix[diagram, u, "QuantumParameter" -> 2,
        "Parameters" -> case[[2]]]["KMatrix"];
      AssociationQ[boundary] &&
        FreeQ[{boundary["CParameters"], boundary["SParameters"]}, u] &&
        VerifyKMatrix[matrix, diagram, u, 2,
          boundary["CParameters"], boundary["SParameters"],
          "Equation" -> boundary["Equation"]],
      {case, cases}
    ]
  ],
  True,
  TestID -> "twisted-plain-notebook-conventions-verified"
]

VerificationTest[
  Module[{leftMismatch, rightMismatch, leftFlip, rightFlip, diagrams,
      classifications, results, inference, parameterData},
    leftMismatch = CreateSatakeDiagram["A2n-1(2)", 3, {0, 3}];
    rightMismatch = CreateSatakeDiagram["A2n-1(2)T", 3, {0, 3}];
    leftFlip = CreateSatakeDiagram["A2n-1(2)", 4, {}, {1, 0, 2, 3, 4}];
    rightFlip = CreateSatakeDiagram["A2n-1(2)T", 4, {}, {0, 1, 2, 4, 3}];
    diagrams = {leftMismatch, rightMismatch, leftFlip, rightFlip};
    classifications = ClassifySatakeDiagram /@ diagrams;
    results = KMatrix[#, u, "QuantumParameter" -> 2] & /@ diagrams;
    {Lookup[classifications[[1 ;; 2]], "ClassificationStatus"],
      Lookup[classifications[[3 ;; 4]], "Regime"],
      Lookup[Lookup[results, "Transport"], "Reason"],
      And @@ MapThread[
        Function[{diagram, result},
          inference = InferCoidealParameters[
            result["KMatrix"], diagram, u, 2];
          If[FailureQ[inference], Return[False]];
          parameterData = First[inference["ParameterData"]];
          VerifyKMatrix[result["KMatrix"], diagram, u, 2,
            parameterData["CParameters"], parameterData["SParameters"],
            "Equation" -> inference["Equation"]]
        ],
        {diagrams, results}
      ]}
  ],
  {{"ClassifiedUpToDiagramAutomorphism",
    "ClassifiedUpToDiagramAutomorphism"},
   {"FormulaTransportPending", "FormulaTransportPending"},
   {"DiagramAutomorphism", "DiagramAutomorphism",
    "ForkExchange", "ForkExchange"}, True},
  TestID -> "diagram-automorphism-and-fork-transport-verified"
]

VerificationTest[
  Module[{diagrams, results, boundary, base, specialized},
    diagrams = {
      CreateSatakeDiagram["A2n-1(2)", 4, {4}, {1, 0, 2, 3, 4}],
      CreateSatakeDiagram["A2n-1(2)T", 4, {0}, {0, 1, 2, 4, 3}],
      CreateSatakeDiagram["A2n(2)", 4, {0, 4}],
      CreateSatakeDiagram["A2n(2)T", 4, {0, 4}],
      CreateSatakeDiagram["Dn+1(2)", 4, {0, 4}],
      CreateSatakeDiagram["Dn+1(2)", 3, {3}]
    };
    results = KMatrix[#, u, "QuantumParameter" -> 2,
        "Parameters" -> <|"Nu" -> 3|>] & /@ diagrams;
    {Lookup[Lookup[results, "Provenance"], "Branch"],
      And @@ MapThread[
        Function[{diagram, result},
          boundary = CanonicalCoidealParameters[diagram, 2,
            "Parameters" -> <|"Nu" -> 3|>];
          AssociationQ[boundary] &&
            VerifyKMatrix[result["KMatrix"], diagram, u, 2,
              boundary["CParameters"], boundary["SParameters"],
              "Equation" -> boundary["Equation"]]
        ],
        {diagrams, results}
      ],
      And @@ Table[
        base = KMatrix[<|"Rank" -> 4, "Family" -> family,
          "Parameters" -> <|"l" -> 1, "r" -> 3|>|>, u,
          "QuantumParameter" -> 2]["KMatrix"];
        specialized = KMatrix[<|"Rank" -> 4, "Family" -> family,
          "Parameters" -> <|"l" -> 1, "r" -> 3,
            "Regime" -> "NonQuasistandard", "Nu" -> I|>|>, u,
          "QuantumParameter" -> 2]["KMatrix"];
        Together[Normal[specialized - base]] ===
          ConstantArray[0, Dimensions[base]],
        {family, {"B*.1", "tB*.1", "C**.1", "tC**.1", "C*.1"}}
      ]}
  ],
  {{"NonQuasistandardGeneric", "NonQuasistandardGeneric",
    "NonQuasistandardGeneric", "NonQuasistandardGeneric",
    "NonQuasistandardGeneric", "NonQuasistandardGeneric"}, True, True},
  TestID -> "generic-nonquasistandard-twisted-families-verified"
]

VerificationTest[
  Module[{diagram, result, boundary, base, specialized},
    diagram = CreateSatakeDiagram["A2n-1(2)", 3, {3}];
    result = KMatrix[diagram, u, "QuantumParameter" -> 2,
      "Parameters" -> <|"Nu0" -> 3, "Nu1" -> 5|>];
    boundary = CanonicalCoidealParameters[diagram, 2,
      "Parameters" -> <|"Nu0" -> 3, "Nu1" -> 5|>];
    base = KMatrix[<|"Rank" -> 3, "Family" -> "B*.1",
      "Parameters" -> <|"l" -> 0, "r" -> 2|>|>, u,
      "QuantumParameter" -> 2]["KMatrix"];
    specialized = KMatrix[<|"Rank" -> 3, "Family" -> "B*.1",
      "Parameters" -> <|"l" -> 0, "r" -> 2,
        "Regime" -> "NonQuasistandard", "Nu0" -> I, "Nu1" -> I|>|>,
      u, "QuantumParameter" -> 2]["KMatrix"];
    {result["Provenance", "NotebookSymbol"],
      result["Provenance", "Branch"],
      VerifyKMatrix[result["KMatrix"], diagram, u, 2,
        boundary["CParameters"], boundary["SParameters"],
        "Equation" -> boundary["Equation"]],
      Together[Normal[specialized - base]] ===
        ConstantArray[0, Dimensions[base]]}
  ],
  {"KDC1xx", "NonQuasistandardEndpoint01", True, True},
  TestID -> "Bstar1-endpoint-nonquasistandard-verified"
]

VerificationTest[
  Module[{diagram, result, boundary, base, specialized},
    diagram = CreateSatakeDiagram["A2n(2)", 3, {0, 1}];
    result = KMatrix[diagram, u, "QuantumParameter" -> 2,
      "Parameters" -> <|"Nu" -> 3|>];
    boundary = CanonicalCoidealParameters[diagram, 2,
      "Parameters" -> <|"Nu" -> 3|>];
    base = KMatrix[diagram, u, "QuantumParameter" -> 2]["KMatrix"];
    specialized = KMatrix[diagram, u, "QuantumParameter" -> 2,
      "Parameters" -> <|"Nu" -> I|>]["KMatrix"];
    {result["Provenance", "NotebookSymbol"],
      result["Provenance", "Branch"],
      VerifyKMatrix[result["KMatrix"], diagram, u, 2,
        boundary["CParameters"], boundary["SParameters"],
        "Equation" -> boundary["Equation"]],
      Together[Normal[specialized - base]] ===
        ConstantArray[0, Dimensions[base]]}
  ],
  {"KCB1xx", "NonQuasistandardEndpointN", True, True},
  TestID -> "Cstarstar1-endpoint-nonquasistandard-verified"
]

VerificationTest[
  Module[{diagram, result, boundary, base, specialized},
    diagram = CreateSatakeDiagram["A2n(2)T", 3, {2, 3}];
    result = KMatrix[diagram, u, "QuantumParameter" -> 2,
      "Parameters" -> <|"Nu" -> 3|>];
    boundary = CanonicalCoidealParameters[diagram, 2,
      "Parameters" -> <|"Nu" -> 3|>];
    base = KMatrix[diagram, u, "QuantumParameter" -> 2]["KMatrix"];
    specialized = KMatrix[diagram, u, "QuantumParameter" -> 2,
      "Parameters" -> <|"Nu" -> I|>]["KMatrix"];
    {result["Provenance", "NotebookSymbol"],
      result["Provenance", "Branch"],
      VerifyKMatrix[result["KMatrix"], diagram, u, 2,
        boundary["CParameters"], boundary["SParameters"],
        "Equation" -> boundary["Equation"]],
      Together[Normal[specialized - base]] ===
        ConstantArray[0, Dimensions[base]]}
  ],
  {"KBC1xx", "NonQuasistandardEndpoint0", True, True},
  TestID -> "dual-Cstarstar1-endpoint-nonquasistandard-verified"
]

VerificationTest[
  Module[{diagram, result, boundary, base, specialized},
    diagram = CreateSatakeDiagram["Dn+1(2)", 3, {2, 3}];
    result = KMatrix[diagram, u, "QuantumParameter" -> 2,
      "Parameters" -> <|"Nu" -> 3|>];
    boundary = CanonicalCoidealParameters[diagram, 2,
      "Parameters" -> <|"Nu" -> 3|>];
    base = KMatrix[diagram, u, "QuantumParameter" -> 2]["KMatrix"];
    specialized = KMatrix[diagram, u, "QuantumParameter" -> 2,
      "Parameters" -> <|"Nu" -> I|>]["KMatrix"];
    {result["Provenance", "NotebookSymbol"],
      result["Provenance", "Branch"],
      VerifyKMatrix[result["KMatrix"], diagram, u, 2,
        boundary["CParameters"], boundary["SParameters"],
        "Equation" -> boundary["Equation"]],
      Together[Normal[specialized - base]] ===
        ConstantArray[0, Dimensions[base]]}
  ],
  {"KBB1xx", "NonQuasistandardEndpoint0", True, True},
  TestID -> "Cstar1-endpoint-nonquasistandard-verified"
]

VerificationTest[
  Module[{specs, rep, dual},
    specs = {{"A(1)", 2}, {"B(1)", 2}, {"C(1)", 2}, {"D(1)", 4},
      {"A2n-1(2)", 3}, {"A2n-1(2)T", 3}, {"A2n(2)", 2},
      {"A2n(2)T", 2}, {"Dn+1(2)", 2}};
    And @@ Table[
      rep = VectorRepresentation[spec[[1]], spec[[2]], 3, 4];
      dual = DualVectorRepresentation[rep];
      VerifyVectorRepresentation[rep]["Valid"] &&
        VerifyVectorRepresentation[dual]["Valid"],
      {spec, specs}
    ]
  ],
  True,
  TestID -> "all-vector-and-dual-representations"
]

VerificationTest[
  FailureQ[CreateSatakeDiagram["A2n(2)", 2, {1}, {0, 2, 1}]],
  True,
  {CreateSatakeDiagram::invalid},
  TestID -> "invalid-tau"
]

VerificationTest[
  Module[{left, right, solved},
    left = {DiagonalMatrix[{1, 2}]};
    right = left;
    solved = SolveBoundaryIntertwiner[left, right];
    {solved["Dimension"], Length[solved["Basis"]]}
  ],
  {2, 2},
  TestID -> "linear-intertwiner-centralizer"
]

VerificationTest[
  Module[{left, right, solved},
    left = {{{0, 1}, {1, 0}}, DiagonalMatrix[{1, -1}]};
    right = left;
    solved = SolveBoundaryIntertwiner[left, right];
    solved["Dimension"]
  ],
  1,
  TestID -> "scalar-centralizer"
]

VerificationTest[
  Module[{d, result},
    d = <|"Rank" -> 3, "Family" -> "B*.1", "Parameters" -> <|"l" -> 0, "r" -> 0|>|>;
    result = KMatrix[d, u];
    result["KMatrix"] === IdentityMatrix[6, SparseArray]
  ],
  True,
  TestID -> "B-star-1-trivial-block"
]

VerificationTest[
  Normal[KMatrix[<|"Rank" -> 2, "Family" -> "A.1"|>, u]["KMatrix"]],
  IdentityMatrix[3],
  TestID -> "catalogue-A1"
]

VerificationTest[
  Normal[KMatrix[<|"Rank" -> 3, "Family" -> "A.2"|>, u,
    "QuantumParameter" -> 4]["KMatrix"]],
  {{0, 2, 0, 0}, {-1/2, 0, 0, 0},
    {0, 0, 0, 2}, {0, 0, -1/2, 0}},
  TestID -> "catalogue-A2"
]

VerificationTest[
  Normal[KMatrix[<|"Rank" -> 3, "Family" -> "A.4"|>, u]["KMatrix"]],
  {{0, 0, 1, 0}, {0, 0, 0, 1},
    {u, 0, 0, 0}, {0, u, 0, 0}},
  TestID -> "catalogue-A4"
]

VerificationTest[
  Module[{result},
    result = KMatrix[<|"Rank" -> 4, "Family" -> "A.3",
      "Parameters" -> <|"l" -> 0, "r" -> 2, "t" -> 5,
        "Lambda" -> lambda, "Mu" -> mu|>|>, u]["KMatrix"];
    Dimensions[result] === {5, 5} &&
      Together[Normal[result] /. u -> 1] === IdentityMatrix[5]
  ],
  True,
  TestID -> "catalogue-A3-regularity"
]

VerificationTest[
  Module[{b, d},
    b = KMatrix[<|"Rank" -> 3, "Family" -> "B.1",
      "Parameters" -> <|"l" -> 0, "r" -> 2|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    d = KMatrix[<|"Rank" -> 4, "Family" -> "D.1",
      "Parameters" -> <|"l" -> 2, "r" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    {Dimensions[b], Dimensions[d],
      Together[Normal[b] /. u -> 1] === IdentityMatrix[7],
      Together[Normal[d] /. u -> 1] === IdentityMatrix[8]}
  ],
  {{7, 7}, {8, 8}, True, True},
  TestID -> "catalogue-BD1-regularity"
]

VerificationTest[
  Module[{c1, c2},
    c1 = KMatrix[<|"Rank" -> 4, "Family" -> "C.1",
      "Parameters" -> <|"l" -> 0, "r" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    c2 = KMatrix[<|"Rank" -> 4, "Family" -> "C.2",
      "Parameters" -> <|"l" -> 0, "r" -> 2|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    {Dimensions[c1], Dimensions[c2],
      Together[Normal[c1] /. u -> 1] === IdentityMatrix[8],
      Together[Normal[c2] /. u -> 1] === IdentityMatrix[8]}
  ],
  {{8, 8}, {8, 8}, True, True},
  TestID -> "catalogue-C12-regularity"
]

VerificationTest[
  Module[{b, d},
    b = KMatrix[<|"Rank" -> 3, "Family" -> "B.2",
      "Parameters" -> <|"l" -> 0, "r" -> 2, "Mu" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    d = KMatrix[<|"Rank" -> 4, "Family" -> "D.2",
      "Parameters" -> <|"l" -> 0, "r" -> 2, "Mu" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    {Dimensions[b], Dimensions[d],
      Together[Normal[b] /. u -> 1] === IdentityMatrix[7],
      Together[Normal[d] /. u -> 1] === IdentityMatrix[8]}
  ],
  {{7, 7}, {8, 8}, True, True},
  TestID -> "catalogue-BD2-regularity"
]

VerificationTest[
  Module[{tb, ctw},
    tb = KMatrix[<|"Rank" -> 3, "Family" -> "tB*.1",
      "Parameters" -> <|"l" -> 0, "r" -> 2|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    ctw = KMatrix[<|"Rank" -> 2, "Family" -> "C**.1",
      "Parameters" -> <|"l" -> 0, "r" -> 1, "Mu" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    {Dimensions[tb], Dimensions[ctw],
      Together[Normal[tb] /. u -> 1] === IdentityMatrix[6],
      Together[Normal[ctw] /. u -> 1] === IdentityMatrix[5]}
  ],
  {{6, 6}, {5, 5}, True, True},
  TestID -> "catalogue-tB-Cdouble-plain"
]

VerificationTest[
  Module[{tc, cstar},
    tc = KMatrix[<|"Rank" -> 2, "Family" -> "tC**.1",
      "Parameters" -> <|"l" -> 0, "r" -> 1|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    cstar = KMatrix[<|"Rank" -> 2, "Family" -> "C*.1",
      "Parameters" -> <|"l" -> 0, "r" -> 1|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    {Dimensions[tc], Dimensions[cstar],
      Together[Normal[tc] /. u -> 1] === IdentityMatrix[5],
      Together[Normal[cstar] /. u -> 1] === IdentityMatrix[6]}
  ],
  {{5, 5}, {6, 6}, True, True},
  TestID -> "catalogue-squared-plain-twisted"
]

VerificationTest[
  Module[{b, tb, c},
    b = KMatrix[<|"Rank" -> 3, "Family" -> "B*.2",
      "Parameters" -> <|"l" -> 0, "r" -> 2, "Mu" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    tb = KMatrix[<|"Rank" -> 3, "Family" -> "tB*.2",
      "Parameters" -> <|"l" -> 0, "r" -> 1|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    c = KMatrix[<|"Rank" -> 2, "Family" -> "C**.2",
      "Parameters" -> <|"l" -> 0, "r" -> 2|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    {Dimensions /@ {b, tb, c},
      And @@ (Together[Normal[#] /. u -> 1] === IdentityMatrix[Length[#]] & /@
        {b, tb, c})}
  ],
  {{{6, 6}, {6, 6}, {5, 5}}, True},
  TestID -> "catalogue-twisted-alternating"
]

VerificationTest[
  Module[{tc, cstar},
    tc = KMatrix[<|"Rank" -> 2, "Family" -> "tC**.2",
      "Parameters" -> <|"l" -> 0, "r" -> 2|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    cstar = KMatrix[<|"Rank" -> 2, "Family" -> "C*.2",
      "Parameters" -> <|"l" -> 0, "r" -> 1, "Lambda" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    {Dimensions[tc], Dimensions[cstar],
      Together[Normal[tc] /. u -> 1] === IdentityMatrix[5],
      Together[Normal[cstar] /. u -> 1] === IdentityMatrix[6]}
  ],
  {{5, 5}, {6, 6}, True, True},
  TestID -> "catalogue-squared-alternating-twisted"
]

VerificationTest[
  Module[{c, dGeneric, dSpecial},
    c = KMatrix[<|"Rank" -> 4, "Family" -> "C.4",
      "Parameters" -> <|"l" -> 2, "Lambda" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    dGeneric = KMatrix[<|"Rank" -> 4, "Family" -> "D.4",
      "Parameters" -> <|"l" -> 2, "Lambda" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    dSpecial = KMatrix[<|"Rank" -> 4, "Family" -> "D.4",
      "Parameters" -> <|"l" -> 1, "Lambda" -> 3, "Alpha" -> 2|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    {Dimensions /@ {c, dGeneric, dSpecial},
      And @@ (Together[Normal[#] /. u -> 1] === IdentityMatrix[Length[#]] & /@
        {c, dGeneric, dSpecial})}
  ],
  {{{8, 8}, {8, 8}, {8, 8}}, True},
  TestID -> "catalogue-untwisted-parallel"
]

VerificationTest[
  Module[{matrix},
    matrix = KMatrix[<|"Rank" -> 3, "Family" -> "C*.4",
      "Parameters" -> <|"l" -> 1, "Lambda" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    {Dimensions[matrix],
      Together[Normal[matrix] /. u -> 1] === IdentityMatrix[8]}
  ],
  {{8, 8}, True},
  TestID -> "catalogue-twisted-parallel"
]

VerificationTest[
  Module[{c, d},
    c = KMatrix[<|"Rank" -> 4, "Family" -> "C.4",
      "Parameters" -> <|"l" -> 1, "Lambda" -> 3|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    d = KMatrix[<|"Rank" -> 4, "Family" -> "D.4",
      "Parameters" -> <|"l" -> 1, "Lambda" -> 3, "Alpha" -> 1|>|>, u,
      "QuantumParameter" -> 4]["KMatrix"];
    Together[Normal[c - d]] === ConstantArray[0, {8, 8}]
  ],
  True,
  TestID -> "D4-special-reduces-to-generic"
]

VerificationTest[
  Module[{result, matrix, mu = 3/4, expected},
    result = KMatrix[<|"Rank" -> 3, "Family" -> "C*.4",
      "Parameters" -> <|"l" -> 1, "Lambda" -> 3|>|>, u,
      "QuantumParameter" -> 4];
    matrix = Normal[result["KMatrix"]];
    expected = I u^-1 (u^2 - u^-2)/
      ((3 mu - u^2) (1/3 + (mu u^2)^-1));
    {Together[matrix[[5, 4]] - expected],
      result["Provenance"]["NotebookSymbol"]}
  ],
  {0, "KBB4"},
  TestID -> "C-star-4-special-coupling"
]

VerificationTest[
  Module[{d, result},
    d = <|
      "Rank" -> 3,
      "Family" -> "B*.1",
      "Parameters" -> <|"l" -> 0, "r" -> 2, "Lambda" -> lambda, "Mu" -> mu|>
    |>;
    result = Normal[KMatrix[d, u]["KMatrix"]];
    Together[result /. u -> 1] === IdentityMatrix[6]
  ],
  True,
  TestID -> "B-star-1-regularity"
]

VerificationTest[
  Module[{d, result},
    d = CreateSatakeDiagram["A(1)", 1, {}];
    result = KMatrix[d, u,
      "QuantumParameter" -> 2,
      "CParameters" -> <|0 -> 1/2, 1 -> 1/2|>,
      "NormalizeAt" -> 1];
    {result["Dimension"], result["Equation"],
      KeyExistsQ[result, "NormalizedKMatrix"]}
  ],
  {1, "Standard", True},
  TestID -> "derive-untwisted-A1-standard"
]

VerificationTest[
  Module[{d, result},
    d = CreateSatakeDiagram["A(1)", 2, {}];
    result = KMatrix[d, u,
      "QuantumParameter" -> 2,
      "CParameters" -> <|0 -> 1, 1 -> 1, 2 -> 1|>];
    {result["Dimension"], result["Equation"],
      Together[Normal[First[result["Basis"]]]] === -IdentityMatrix[3]}
  ],
  {1, "Transposed", True},
  TestID -> "derive-untwisted-A2-transposed"
]

VerificationTest[
  Module[{d, result},
    d = CreateSatakeDiagram["A2n-1(2)", 3, {1, 2, 3}];
    result = KMatrix[d, u,
      "QuantumParameter" -> 2,
      "CParameters" -> <|0 -> -64|>,
      "Equation" -> "Standard"];
    {result["Dimension"],
      Together[Normal[First[result["Basis"]]]] === IdentityMatrix[6]}
  ],
  {1, True},
  TestID -> "derive-twisted-A2n-minus-1"
]

VerificationTest[
  QREKMatricesVersion[],
  "0.13.0",
  TestID -> "web-engine-version"
]

VerificationTest[
  Module[{data},
    data = WebExpressionData[SparseArray[{{1, 2} -> q/2}, {2, 2}]];
    {data["kind"], data["dimensions"], data["indexBase"],
      data["entries"][[1, "index"]],
      data["entries"][[1, "value", "kind"]]}
  ],
  {"sparseMatrix", {2, 2}, 0, {0, 1}, "call"},
  TestID -> "web-expression-sparse-symbolic-matrix"
]

VerificationTest[
  Module[{data, records, ids},
    data = WebCatalogueData["A2n(2)", 2, "IncludeKMatrices" -> False];
    records = data["diagrams"];
    ids = Lookup[records, "id"];
    {data["schemaVersion"], data["engine", "version"],
      data["summary", "diagramCount"], DuplicateFreeQ[ids],
      Union[Lookup[Lookup[records, "computation"], "status"]]}
  ],
  {"1.2.0", "0.13.0", 7, True, {"NotRequested"}},
  TestID -> "web-catalogue-stable-records"
]

VerificationTest[
  Module[{directory, manifest, imported},
    directory = FileNameJoin[{$TemporaryDirectory,
      "qre-web-export-" <> IntegerString[Hash[$SessionID]]}];
    manifest = ExportWebCatalogue[directory,
      "Types" -> {"A2n(2)"}, "Ranks" -> {2},
      "IncludeKMatrices" -> False];
    imported = Import[FileNameJoin[{directory, "manifest.json"}], "RawJSON"];
    {manifest["files"][[1, "diagramCount"]],
      imported["schemaVersion"],
      FileExistsQ[FileNameJoin[{directory, imported["files"][[1, "path"]]}]]}
  ],
  {7, "1.2.0", True},
  TestID -> "web-catalogue-export-manifest"
]

VerificationTest[
  Module[{data, solutions, solution},
    data = WebCatalogueData["A2n(2)", 2,
      "IncludeKMatrices" -> True, "QuantumParameter" -> 2];
    solutions = DeleteCases[Lookup[Lookup[data["diagrams"], "computation"],
      "solution"], Null];
    solution = First[solutions];
    {solution["realization"], solution["transformations"],
      solution["matrix", "kind"], StringQ[solution["latex"]],
      StringFreeQ[solution["latex"], "QREKMatrices"]}
  ],
  {"bare", {}, "sparseMatrix", True, True},
  TestID -> "web-catalogue-includes-safe-k-matrices"
]

VerificationTest[
  Module[{diagram, qsp},
    diagram = First[Select[GeneralizedSatakeDiagrams["A2n-1(2)", 3],
      #["X"] =!= {} &]];
    qsp = QSPPresentationData[diagram];
    {qsp["status"], qsp["indexSets", "levi"] === diagram["X"],
      qsp["indexSets", "boundary"] === Complement[diagram["Nodes"], diagram["X"]],
      ListQ[qsp["theta", "longestParabolicWord"]],
      StringContainsQ[qsp["generatorGroups"][[3, "latex"]], "s_i"]}
  ],
  {"instantiatedPresentation", True, True, True, True},
  TestID -> "qsp-presentation-structured-record"
]

VerificationTest[
  Module[{linear, quadratic},
    linear = AmbientRMatrixData["A2n(2)", 2];
    quadratic = AmbientRMatrixData["Dn+1(2)", 2];
    {linear["representation", "dimension"],
      linear["rMatrix", "formulaKind"],
      quadratic["representation", "dimension"],
      quadratic["rMatrix", "formulaKind"],
      StringContainsQ[quadratic["rMatrix", "latex"], "D_q"]}
  ],
  {5, "twistedLinear", 6, "twistedQuadratic", True},
  TestID -> "ambient-r-matrix-registry-covers-twisted-formulas"
]

VerificationTest[
  Module[{specs, matrix, permutation, labels},
    specs = {{"A(1)", 2}, {"B(1)", 2}, {"C(1)", 2}, {"D(1)", 4},
      {"A2n-1(2)", 3}, {"A2n-1(2)T", 2}, {"A2n(2)", 2},
      {"A2n(2)T", 2}, {"Dn+1(2)", 2}};
    And @@ Table[
      labels = QREKMatrices`Private`representationBasis[spec[[1]], spec[[2]]];
      matrix = AmbientRMatrix[spec[[1]], spec[[2]], 1, 4];
      permutation = QREKMatrices`Private`ambientPermutation[labels];
      SparseArrayQ[matrix] && Normal[matrix - permutation] ===
        ConstantArray[0, Dimensions[matrix]],
      {spec, specs}]
  ],
  True,
  TestID -> "ambient-r-matrices-materialize-and-are-regular"
]

VerificationTest[
  Module[{specs, forward, backward, permutation, labels, identity},
    specs = {{"A(1)", 2}, {"B(1)", 2}, {"C(1)", 2}, {"D(1)", 4},
      {"A2n-1(2)", 3}, {"A2n-1(2)T", 2}, {"A2n(2)", 2},
      {"A2n(2)T", 2}, {"Dn+1(2)", 2}};
    And @@ Table[
      labels = QREKMatrices`Private`representationBasis[spec[[1]], spec[[2]]];
      permutation = QREKMatrices`Private`ambientPermutation[labels];
      forward = AmbientRMatrix[spec[[1]], spec[[2]], 2, 4];
      backward = AmbientRMatrix[spec[[1]], spec[[2]], 1/2, 4];
      identity = IdentityMatrix[Length[forward]];
      Normal[Map[Together, forward.permutation.backward.permutation - identity,
        {2}]] === ConstantArray[0, Dimensions[forward]],
      {spec, specs}]
  ],
  True,
  TestID -> "ambient-r-matrices-exact-unitarity-sample"
]

VerificationTest[
  Module[{specs, labels, dimension, permutation, swap23, r12, r23, r13,
    residual},
    specs = {{"A(1)", 2}, {"B(1)", 2}, {"C(1)", 2}, {"D(1)", 4},
      {"A2n-1(2)", 3}, {"A2n-1(2)T", 2}, {"A2n(2)", 2},
      {"A2n(2)T", 2}, {"Dn+1(2)", 2}};
    And @@ Table[
      labels = QREKMatrices`Private`representationBasis[spec[[1]], spec[[2]]];
      dimension = Length[labels];
      permutation = QREKMatrices`Private`ambientPermutation[labels];
      swap23 = KroneckerProduct[IdentityMatrix[dimension], permutation];
      r12[x_] := KroneckerProduct[
        AmbientRMatrix[spec[[1]], spec[[2]], x, 4], IdentityMatrix[dimension]];
      r23[x_] := KroneckerProduct[IdentityMatrix[dimension],
        AmbientRMatrix[spec[[1]], spec[[2]], x, 4]];
      r13[x_] := swap23.r12[x].swap23;
      residual = r12[2/3].r13[2/5].r23[3/5] -
        r23[3/5].r13[2/5].r12[2/3];
      And @@ (PossibleZeroQ /@ Last /@ Most[ArrayRules[residual]]),
      {spec, specs}]
  ],
  True,
  TestID -> "ambient-r-matrices-exact-yang-baxter-sample"
]

VerificationTest[
  Module[{diagram, result},
    diagram = CreateSatakeDiagram["A(1)", 1, {}];
    result = KMatrix[diagram, u,
      "QuantumParameter" -> 4,
      "CParameters" -> <|0 -> 1/4, 1 -> 1/4|>];
    VerifyReflectionEquation[result["KMatrix"], diagram, {u, v}, 4]
  ],
  True,
  TestID -> "reflection-equation-exact-certificate-A1"
]

VerificationTest[
  Module[{diagram, standard, transposed},
    diagram = CreateSatakeDiagram["B(1)", 2, {0}, Range[0, 2]];
    standard = ReflectionEquationData[diagram, "b-r"];
    diagram = CreateSatakeDiagram["A(1)", 2, {}, Range[0, 2]];
    transposed = ReflectionEquationData[diagram, "a-r"];
    {standard["kind"], standard["rMatrixId"],
      transposed["kind"], transposed["conventions", "partialTranspose"]}
  ],
  {"Standard", "b-r", "Transposed", "firstTensorFactor"},
  TestID -> "reflection-equation-record-binds-conventions"
]
