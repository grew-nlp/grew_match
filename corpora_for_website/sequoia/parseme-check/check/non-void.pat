% This pattern should return no result
pattern { N [upos, !void] }      % a node N which is not void
without { X -[re"D:.*"]-> N }    % wihtout blue incoming edge
without { X -[re"[a-z].*"]-> N } % wihtout black incoming edge
