% Search for a node COORD without a sub-constituent CC or PONCT
match { M [cat=COORD] }
without { M -> N; N[cat=CC|PONCT] }
