pragma solidity 0.4.24;

import '../CommunityTransferManager.sol';


contract CommunityTransferManagerMock is CommunityTransferManager {

  function addRuleFullParams(bytes32 _fromMask, bytes32 _toMask, bool _isMax, uint256 _amount) public onlyAdmin {
    addRule(_fromMask, _toMask, _isMax, _amount);
  }

}
