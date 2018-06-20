% Regular expression for expressing constraint on a feature value

pattern {
  N [];                 % The node N must be declared
  N.form = re".*ing";   % <== No space between 're' and the following string
}
