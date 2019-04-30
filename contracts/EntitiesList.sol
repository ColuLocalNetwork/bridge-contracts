pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract EntitiesList is Ownable {
  struct Entity {
      string uri;
      bytes32 permissions;
  }

  mapping (address => Entity) private _entities;
  
  event EntityAdded(address indexed account, string entityUri, bytes32 permissions);
  event EntityRemoved(address indexed account);
  event EntityPermissionsUpdated(address indexed account, bytes32 permissions);
  event EntityUriUpdated(address indexed account, string uri);


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

    emit EntityAdded(_account, _entityUri, _entityPermissions);
  }

  function removeEntity(address _account) onlyOwner public {
    require(_account != address(0));
    delete _entities[_account];

    emit EntityRemoved(_account);
  }

  function updateEntityUri(address _account, string _entityUri) onlyOwner public {
    require(_account != address(0));
    _entities[_account].uri = _entityUri;

    emit EntityUriUpdated(_account, _entityUri);
  }

  function updateEntityPermissions(address _account, bytes32 _entityPermissions) onlyOwner public {
    require(_account != address(0));
    _entities[_account].permissions = _entityPermissions;

    emit EntityPermissionsUpdated(_account, _entityPermissions);
  }

  function hasPermission(address _account, bytes32 _permissions) public view returns (bool) {
    return (_entities[_account].permissions & _permissions) != bytes32(0);
  }
}