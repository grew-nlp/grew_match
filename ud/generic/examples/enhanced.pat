% Enhanced dependencies are internally encoded with a prefix "E:".
% The following regexp pattern searches for any enhanced dependency.

match { N -[re"E:.*"]-> M }
