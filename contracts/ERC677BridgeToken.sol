pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "./IBurnableMintableERC677Token.sol";
import "./ERC865.sol";
import "./ERC677Receiver.sol";
import "./libraries/Message.sol";


contract ERC677BridgeToken is
    IBurnableMintableERC677Token,
    DetailedERC20,
    BurnableToken,
    MintableToken,
    ERC865 {

    address public bridgeContract;

    event ContractFallbackCallFailed(address from, address to, uint value);

    constructor(
        string _name,
        string _symbol,
        uint8 _decimals)
    public DetailedERC20(_name, _symbol, _decimals) {}

    function setBridgeContract(address _bridgeContract) onlyOwner public {
        require(_bridgeContract != address(0) && isContract(_bridgeContract));
        bridgeContract = _bridgeContract;
    }

    modifier validRecipient(address _recipient) {
        require(_recipient != address(0) && _recipient != address(this));
        _;
    }

    function transferAndCall(address _to, uint _value, bytes _data)
        external validRecipient(_to) returns (bool)
    {
        require(superTransfer(_to, _value));
        emit Transfer(msg.sender, _to, _value, _data);

        if (isContract(_to)) {
            require(contractFallback(_to, _value, _data));
        }
        return true;
    }

    function getTokenInterfacesVersion() public pure returns(uint64 major, uint64 minor, uint64 patch) {
        return (2, 0, 0);
    }

    function superTransfer(address _to, uint256 _value) internal returns(bool)
    {
        return super.transfer(_to, _value);
    }

    function transfer(address _to, uint256 _value) public returns (bool)
    {
        require(superTransfer(_to, _value));
        if (isContract(_to) && !contractFallback(_to, _value, new bytes(0))) {
            if (_to == bridgeContract) {
                revert();
            } else {
                emit ContractFallbackCallFailed(msg.sender, _to, _value);
            }
        }
        return true;
    }

    function contractFallback(address _to, uint _value, bytes _data)
        private
        returns(bool)
    {
        return _to.call(abi.encodeWithSignature("onTokenTransfer(address,uint256,bytes)",  msg.sender, _value, _data));
    }

    function isContract(address _addr)
        internal
        view
        returns (bool)
    {
        uint length;
        assembly { length := extcodesize(_addr) }
        return length > 0;
    }

    function finishMinting() public returns (bool) {
        revert();
    }

    function renounceOwnership() public onlyOwner {
        revert();
    }

    function claimTokens(address _token, address _to) public onlyOwner {
        require(_to != address(0));
        if (_token == address(0)) {
            _to.transfer(address(this).balance);
            return;
        }

        DetailedERC20 token = DetailedERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(_to, balance));
    }

    function transferWithFee(address _sender, address _from, address _to, uint256 _value, uint256 _fee) internal returns(bool)
    {
        balances[_from] = balances[_from].sub(_value).sub(_fee);
        balances[_to] = balances[_to].add(_value);
        balances[_sender] = balances[_sender].add(_fee);
        emit Transfer(_from, _to, _value);
        emit Transfer(_from, _sender, _fee);
        return true;
    }

    function contractFallbackFrom(address _from, address _to, uint _value, bytes _data) private returns(bool)
    {
        return _to.call(abi.encodeWithSignature("onTokenTransfer(address,uint256,bytes)",  _from, _value, _data));
    }

    function transferPreSigned(bytes _signature, address _to, uint256 _value, uint256 _fee, uint256 _timestamp) validRecipient(_to) public returns (bool) {
        bytes32 hashedParams = getTransferPreSignedHash(address(this), _to, _value, _fee, _timestamp);
        address from = Message.recover(hashedParams, _signature);
        require(from != address(0), "Invalid from address recovered");
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false, "Transaction hash was already used");

        require(transferWithFee(msg.sender, from, _to, _value, _fee));
        hashedTxs[hashedTx] = true;
        emit TransferPreSigned(from, _to, msg.sender, _value, _fee);

        if (isContract(_to) && !contractFallbackFrom(from, _to, _value, new bytes(0))) {
            if (_to == bridgeContract) {
                revert();
            } else {
                emit ContractFallbackCallFailed(from, _to, _value);
            }
        }

        return true;
    }

    function getTransferPreSignedHash(address _token, address _to, uint256 _value, uint256 _fee, uint256 _timestamp) public pure returns (bytes32) {
        /* "0d98dcb1": getTransferPreSignedHash(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0x0d98dcb1), _token, _to, _value, _fee, _timestamp));
    }

    function transferAndCallPreSigned(bytes _signature, address _to, uint256 _value, bytes _data, uint256 _fee, uint256 _timestamp) validRecipient(_to) public returns (bool) {
        bytes32 hashedParams = getTransferAndCallPreSignedHash(address(this), _to, _value, _data, _fee, _timestamp);
        address from = Message.recover(hashedParams, _signature);
        require(from != address(0), "Invalid from address recovered");
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false, "Transaction hash was already used");

        require(transferWithFee(msg.sender, from, _to, _value, _fee));
        hashedTxs[hashedTx] = true;
        emit TransferAndCallPreSigned(from, _to, msg.sender, _value, _data, _fee);

        if (isContract(_to)) {
            require(contractFallbackFrom(from, _to, _value, _data));
        }
        return true;
    }

    function getTransferAndCallPreSignedHash(address _token, address _to, uint256 _value, bytes _data, uint256 _fee, uint256 _timestamp) public pure returns (bytes32) {
        /* "cabc0a10": getTransferPreSignedHash(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0xcabc0a10), _token, _to, _value, _data, _fee, _timestamp));
    }
}
