% Enhanced dependencies are internally encoded with a prefix "E:".
% The following regexp pattern searches for any enhanced dependency.

pattern { N -[re"E:.*"]-> M }
