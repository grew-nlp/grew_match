% Matching on node is injective, this means that two different nodes
% in the pattern are mapped to two different nodes on the graph.
% In the example below, even if the two features are identical, two different nodes are searched.
% Only sentence with two different occurrences of the verb "make" are given 

pattern { N1 [ lemma="make" ]; N2 [ lemma="make" ] }
