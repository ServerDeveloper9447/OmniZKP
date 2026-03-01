# Formal Cryptography & Mathematical Models

This document formalizes the low-level abstract mathematics governing the Omni-ZKP Rust enclave.

## 1. Shamir's Secret Sharing over Galois Fields
To ensure secure identity recovery, the Master Secret $s$ is divided into $n$ shards requiring a threshold of $k$ to reconstruct. To prevent floating-point inaccuracies and ensure cryptographic bounds, the interpolation occurs strictly over the finite Galois Field $\text{GF}(2^8)$.

The dealer constructs a random polynomial $f(x)$ of degree $k-1$:

$$f(x) = s + a_1x + a_2x^2 + \dots + a_{k-1}x^{k-1} \pmod p$$

Where $s$ is the $y$-intercept ($f(0) = s$).
To recover the secret, the client-side WASM utilizes Lagrange interpolation upon receiving $k$ valid shards:

$$f(0) = \sum_{j=1}^{k} y_j \prod_{m \neq j} \frac{x_m}{x_m - x_j} \pmod p$$

## 2. The $O(1)$ Spatial Geofence Constraint
To achieve the 5ms execution benchmark, Omni-ZKP avoids lookup tables by defining the valid physical space as a set of roots $R = \{r_1, r_2, \dots, r_n\}$. 

If a verifier requires a user to be at specific distances (e.g., $100m$, $200m$, $300m$, $400m$, or $500m$), we define the constraint polynomial:

$$C_{geo}(d) = (d-100) \times (d-200) \times (d-300) \times (d-400) \times (d-500)$$

Inside the Halo2 Plonkish arithmetization, the custom gate enforces:

$$C_{geo}(\text{user distance}) = 0$$

If a user attempts to input $600m$, $C_{geo}(600) \neq 0$. The gate evaluates to a non-zero element in $\mathbb{F}_p$, breaking the permutation argument and failing the proof instantaneously.

## 3. Multi-Verifier Unlinkability (Nullifier Derivation)
To prevent tracking across different platforms (e.g., Chase Bank vs. Zomato), the circuit generates a scoped nullifier $N_v$ for every proof.

$$N_v = \text{Hash}(s \parallel \text{scope string})$$

Because the cryptographic hash acts as a pseudo-random function, for any two scopes $A$ and $B$, $N_A$ and $N_B$ are computationally indistinguishable from random data, ensuring Zero-Knowledge unlinkability across the network.
