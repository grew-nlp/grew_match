% Each extra node for MWE/NE encoding contains a feature "kind" with value is "MWE" or "NE"
% Pattern below: search for a "MWE" node

pattern { N [kind=MWE] }