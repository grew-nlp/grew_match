% Search two AMR relations with the same target.
% In the pattern: N is this target; N1 and N2 are the sources of the two relations ARG0 and ARG1 respectively.

pattern {
	N1 -[ARG0]-> N;
	N2 -[ARG1]-> N;
}
