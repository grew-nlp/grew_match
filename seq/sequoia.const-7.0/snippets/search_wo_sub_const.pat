% Search for a node Srel-MOD without a sub-constituent NP-SUJ
% TIP: if you put the "without" keyword on a separate line with the previous "}" and the following "{",
% you can easily switch for a research with or without a sub-pattern
% just by adding or removing a '%' character at the beginning of line 7

match { M [cat="Srel-MOD"];
} without {
N [cat="NP-SUJ"]; M -> N }