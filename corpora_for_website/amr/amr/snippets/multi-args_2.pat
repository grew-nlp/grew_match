% Search for a node which is the source of the 3 relations, the targets of ARG0 and ARG1 being identical

pattern {
	N -[ARG0]-> N0;
	N -[ARG1]-> N0;
	N -[ARG2]-> N1;
}
