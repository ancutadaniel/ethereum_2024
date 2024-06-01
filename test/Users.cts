import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Users", function () {
  async function deployUsersFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Users = await hre.ethers.getContractFactory("Users");
    const usersContract = await Users.deploy();

    return { usersContract, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { usersContract, owner } = await loadFixture(deployUsersFixture);

      expect(await usersContract.owner()).to.equal(owner.address);
    });
  });

  describe("User Management", function () {
    it("Should add a user and emit an event", async function () {
      const { usersContract, otherAccount } = await loadFixture(deployUsersFixture);
      const userName = "Alice";

      await expect(usersContract.addUser(otherAccount.address, userName))
        .to.emit(usersContract, "UserAdded")
        .withArgs(otherAccount.address, userName);

      const users = await usersContract.getUsers();
      expect(users.length).to.equal(1);
      expect(users[0].addr).to.equal(otherAccount.address);
      expect(users[0].name).to.equal(userName);
    });

    it("Should return the correct list of users", async function () {
      const { usersContract, owner, otherAccount } = await loadFixture(deployUsersFixture);
      await usersContract.addUser(owner.address, "Owner");
      await usersContract.addUser(otherAccount.address, "Alice");

      const users = await usersContract.getUsers();
      expect(users.length).to.equal(2);
      expect(users[0].addr).to.equal(owner.address);
      expect(users[0].name).to.equal("Owner");
      expect(users[1].addr).to.equal(otherAccount.address);
      expect(users[1].name).to.equal("Alice");
    });
  });
});
