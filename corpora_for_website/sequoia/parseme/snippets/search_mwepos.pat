% Some extra node for MWE/NE encoding contains a feature "mwepos"
% For instance, for a parseme annotation "SCONJ|MWE|CRAN", the mwepos is "SCONJ"

% For MWE nodes, mwepos can be various tags from the UPOS tagset
% For NE nodes, mwepos should always be PROPN

pattern { N [mwepos = SCONJ] }