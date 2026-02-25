// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockVerifier {
    function verifyProof(
        bytes calldata proof, 
        uint256[] calldata pubSignals
    ) external pure returns (bool) {
        // In production, this checks the elliptic curve pairing.
        // For the demo, we assume the off-chain WASM check was sufficient.
        return true; 
    }
}