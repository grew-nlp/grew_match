% During the conversion, if some UD relation remains unconverted at the end, it is prefixed by "FAIL_"
% The pattern below searches for such relations.

pattern { M -[re"FAIL.*"]-> N }
