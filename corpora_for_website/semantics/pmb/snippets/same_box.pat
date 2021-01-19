% Search two relatred nodes `N1` and `N2`, in the same box `B`; clustered by relation label

pattern {
 B -[REF]-> N1;
 B -[REF]-> N2;
 e: N1 -> N2;
}
