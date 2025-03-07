const SUBGRAPH_URL =
  "https://gateway.thegraph.com/api/2f10db5144226a7c40f3b869c798e704/subgraphs/id/EXBcAqmvQi6VAnE9X4MNK83LPeA6c1PsGskffbmThoeK";

(async function () {
  try {
    const {GraphQLClient, gql} = await import("graphql-request"); // Dynamic import
    const client = new GraphQLClient(SUBGRAPH_URL);

    const query = gql`
      query {
        pairs(first: 1000, skip: 3000) {
          id
          token0 {
            symbol
            name
            id
          }
          token1 {
            symbol
            name
            id
          }
          reserveUSD
        }
      }
    `;

    const response = await client.request(query);

    const WMATIC_ADDRESS =
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270".toLowerCase();

    // Filter only pairs that include WMATIC (either token0 or token1)
    const filteredPairs = response.pairs.filter(
      (pair) =>
        (pair.token0.id.toLowerCase() === WMATIC_ADDRESS ||
          pair.token1.id.toLowerCase() === WMATIC_ADDRESS) &&
        pair.reserveUSD &&
        parseFloat(pair.reserveUSD) > 3000 &&
        parseFloat(pair.reserveUSD) < 20000
    );

    console.log(
      "Pairs with WMATIC and liquidity between $10,000 and $100,000:",
      filteredPairs
    );
  } catch (error) {
    console.error("Error:", error);
  }
})();
