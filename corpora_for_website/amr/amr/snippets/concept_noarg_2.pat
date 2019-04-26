% See previous snippet for an explanation of the pattern.

pattern {
	N [label = "go-on-15"];
}
without {
	N -[ARG1]-> A;
}
without {
	A -[ARG1-of]-> N;
}
