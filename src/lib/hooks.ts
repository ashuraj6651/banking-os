  return useQuery({
    queryKey: ["current-affairs"],
    queryFn: () =>
      jfetch<{
        items: {
          id: string;
          tag: string;
          title: string;
          summary: string;
          date: string;
          timeLabel: string;
        }[];
        count?: number;
        providerCount?: number;
        source?: "rapidapi" | "database";
        stale?: boolean;
        empty?: boolean;
      }>("/api/current-affairs"),
  });
}