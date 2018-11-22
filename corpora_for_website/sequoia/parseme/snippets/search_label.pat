% Some extra node for MWE/NE encoding contains a feature "label"
% For instance, for a parseme annotation "PROPN|NE-LOC.final|_", the label is "LOC.final"

% For MWE nodes, labels are: "LVC.full", "VID", "LVC.cause", "IRC" and "MVC"
% For NE nodes, labels are: "PERS.final", "PERS.prim", "LOC.final", "LOC.prim", "ORG.final", "ORG.prim", "EVE.final", "PROD.final" and "PROD.prim"

pattern { N [kind=NE, label = "EVE.final"] }