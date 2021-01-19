% If you want to know more about pattern syntax, please refer to the Tuorial available on UD structures.
% For instance, it is possible to seach for a label following a regular.
% This pattern searches for all concepts starting with the prefix "take-"

pattern { N []; N.label = re"take-.*"; }
