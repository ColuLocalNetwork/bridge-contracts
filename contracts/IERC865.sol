pragma solidity 0.4.24;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract IERC865 is ERC20 {
    mapping(bytes32 => bool) hashedTxs;
    mapping(address => uint256) noncePerAddress;

    event TransferPreSigned(address indexed from, address indexed to, address indexed delegate, uint256 amount, uint256 fee);

    function transferPreSigned(bytes _signature, address _to, uint256 _value, uint256 _fee, uint256 _nonce) public returns (bool);
    function getTransferPreSignedHash(address _token, address _to, uint256 _value, uint256 _fee, uint256 _nonce) public pure returns (bytes32);
    function getNextNonceForAddress(address _address) public view returns (uint256);
}
