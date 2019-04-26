% Search for a node COORD without a sub-constituent CC or PONCT
pattern { M [upos=COORD] }
without { M -> N; N[upos=CC|PONCT] }
