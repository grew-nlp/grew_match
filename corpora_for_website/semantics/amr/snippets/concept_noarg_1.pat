% According to PropBank, the concept "go-on-15" has one argument ARG1 (see http://verbs.colorado.edu/propbank/framesets-english-aliases/go.html#go_on.15)
% The pattern below uses a negative condition (keyword "without") to search for cases where the argument is missing.
% Try it on the corpus "Bio_AMR_Corpus", it should find two solutions.
% These two solutions correspond to the special usage of the "-of" suffix in AMR relation: an "ARG1" relation from "N" to "A" can be expressed as a "ARG1-of" relation from "A" to "N".
% See next snippet for a better solution

pattern {
	N [concept = "go-on-15"];
}
without {
	N -[ARG1]-> A;
}
