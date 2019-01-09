% Some extra node for MWE encoding contains a feature "criterion"
% For instance, for a parseme annotation "SCONJ|MWE|CRAN", the mwepos is "CRAN"

% For MWE nodes, criterion value can be: "CRAN", "IRREG", "LEX", "INSERT", "OP", "seV", "DET", "ZERO", "SYNT", "MORPHO", "ID", "CL", "PRED" or "LEXflou"
% For NE nodes, there is no "criterion" feature

pattern { N [criterion = ZERO] }
