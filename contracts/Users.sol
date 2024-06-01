// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Users {
    address public owner;

    struct User {
        address addr;
        string name;
    }

    User[] public users;

    event UserAdded(address user, string name);

    constructor() {
        owner = msg.sender;
    }

    function addUser(address _addr, string memory _name) public {
        users.push(User(_addr, _name));
        console.log("User added:", _addr, _name);
        emit UserAdded(_addr, _name);
    }

    function getUsers() public view returns (User[] memory) {
        return users;
    }
}
