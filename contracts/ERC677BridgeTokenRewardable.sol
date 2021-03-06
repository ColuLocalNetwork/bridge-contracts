pragma solidity 0.4.24;

import "./ERC677BridgeToken.sol";


contract ERC677BridgeTokenRewardable is ERC677BridgeToken {

    address public blockRewardContract;
    address public validatorSetContract;

    constructor(
        string _name,
        string _symbol,
        uint8 _decimals
    ) public ERC677BridgeToken(_name, _symbol, _decimals) {}

    function setBlockRewardContract(address _blockRewardContract) onlyOwner public {
        require(_blockRewardContract != address(0) && isContract(_blockRewardContract));
        blockRewardContract = _blockRewardContract;
    }

    function setValidatorSetContract(address _validatorSetContract) onlyOwner public {
        require(_validatorSetContract != address(0) && isContract(_validatorSetContract));
        validatorSetContract = _validatorSetContract;
    }

    modifier onlyBlockRewardContract() {
        require(msg.sender == blockRewardContract);
        _;
    }

    modifier onlyValidatorSetContract() {
        require(msg.sender == validatorSetContract);
        _;
    }

    function mintReward(address[] _receivers, uint256[] _rewards) external onlyBlockRewardContract {
        for (uint256 i = 0; i < _receivers.length; i++) {
            address to = _receivers[i];
            uint256 amount = _rewards[i];
            mint(to, amount);
        }
    }

    function stake(address _staker, uint256 _amount) external onlyValidatorSetContract {
        _transfer(_staker, validatorSetContract, _amount);
    }

    function withdraw(address _staker, uint256 _amount) external onlyValidatorSetContract {
      _transfer(validatorSetContract, _staker, _amount);
    }

    function transfer(address _to, uint256 _value) public returns(bool) {
        require(_to != validatorSetContract);
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns(bool) {
        require(_to != validatorSetContract);
        return super.transferFrom(_from, _to, _value);
    }

}
