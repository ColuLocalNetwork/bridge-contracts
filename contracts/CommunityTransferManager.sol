pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./ERC677BridgeToken.sol";
import "./ITransferManager.sol";
import "./EntitiesList.sol";

contract CommunityTransferManager {
  EntitiesList public entitiesList;

  constructor () public {
    entitiesList = new EntitiesList();
    entitiesList.addEntity(msg.sender, '', bytes32(3));
  }

  modifier onlyAdmin () {
    require(entitiesList.hasPermissions(msg.sender, bytes32(3)));
    _;
  }


  /**
   * @dev Whitelist type transfer logic, Should be pluggable in the future.
   * @param _from The address to transfer from.
   * @param _to The address to transfer to.
   * @param _value The address to transfer to.
   */
  function verifyTransfer(address _from, address _to, uint256 _value) public view returns (bool) {
    return entitiesList.permissionsOf(_from) != bytes32(0) &&
      entitiesList.permissionsOf(_to) != bytes32(0);
  }

  function join(string _entityUri) public {
    entitiesList.addEntity(msg.sender, _entityUri, bytes32(1));
  }

  function addUser(address _account, string _entityUri) public onlyAdmin {
    entitiesList.addEntity(_account, _entityUri, bytes32(1));
  }

  function addBusiness(address _account, string _entityUri) public onlyAdmin {
    entitiesList.addEntity(_account, _entityUri, bytes32(2));
  }

  function addAdmin(address _account, string _entityUri) public onlyAdmin {
    entitiesList.addEntity(_account, _entityUri, bytes32(3));
  }

  function updateEntityUri(address _account, string _entityUri) public onlyAdmin {
    entitiesList.updateEntityUri(_account, _entityUri);
  }

  function removeEntity(address _account) onlyAdmin public {
    entitiesList.removeEntity(_account);
  }

}
