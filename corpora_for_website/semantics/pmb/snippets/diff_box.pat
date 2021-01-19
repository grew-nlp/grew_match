% Search two relatred nodes `N1` and `N2`, in the different boxes `B1` and `B2`; clustered by relation label

pattern {
 B1 -[REF]-> N1;
 B2 -[REF]-> N2;
 e: N1 -> N2;
}
