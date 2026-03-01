// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract OmniAnchor {
    // Maps a Credential Hash to its immutable Block Timestamp
    mapping(bytes32 => uint256) public credentialTimestamps;
    
    event CredentialAnchored(bytes32 indexed credentialHash, uint256 timestamp);

    function anchorCredential(bytes32 credentialHash) external {
        require(credentialTimestamps[credentialHash] == 0, "Error: Credential already anchored.");
        
        credentialTimestamps[credentialHash] = block.timestamp;
        emit CredentialAnchored(credentialHash, block.timestamp);
    }

    function verifyTimestamp(bytes32 credentialHash) external view returns (uint256) {
        return credentialTimestamps[credentialHash];
    }
}