pattern {
	MWE [criterion = IRREG];          % IRREG criterion
	MWE -[MWE]-> N1; MWE -[MWE]-> N2; % At least 2 items
    N1 < N2;                          % Fix the order (avoid duplicates)
}
without { MWE -[MWE]-> N0; N0 << N1 } % Ensure we have the first 2 items (avoid duplicates)
without { N1 -[dep_cpd]-> * }         % The MWE is not annotated with dep_cpd
