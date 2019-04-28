pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract EntitiesList is Ownable {
  struct Entity {
      string uri;
      bytes32 permissions;
  }

  mapping (address => Entity) private _entities;
  
  function entityOf(address _account) public view returns (string, bytes32) {
    return (_entities[_account].uri, _entities[_account].permissions);
  }


  function permissionsOf(address _account) public view returns (bytes32) {
    return _entities[_account].permissions;
  }

  function addEntity(address _account, string _entityUri, bytes32 _entityPermissions) onlyOwner public {
    require(_account != address(0));
    require(_entities[_account].permissions == bytes32(0));
    _entities[_account] = Entity({uri: _entityUri, permissions: _entityPermissions});
  }

  function removeEntity(address _account) onlyOwner public {
    require(_account != address(0));
    delete _entities[_account];
  }

  function updateEntityUri(address _account, string _entityUri) onlyOwner public {
    require(_account != address(0));
    _entities[_account].uri = _entityUri;
  }

  function hasPermissions(address _account, bytes32 _permissions) public view returns (bool) {
    return _entities[_account].permissions == _permissions;
  }
}