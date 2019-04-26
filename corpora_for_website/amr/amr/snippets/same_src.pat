% Search two AMR relations with the same source.
% In the pattern: N is this source; N1 and N2 are the targets of the two relations ARG2 and ARG3 respectively.

pattern {
	N -[ARG2]-> N1;
	N -[ARG3]-> N2;
}
