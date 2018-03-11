pragma solidity ^0.4.18;
import "./SafeMath.sol";


contract Escrow {
    uint public productId;
    address public buyer;
    address public seller;
    address public arbiter;
    uint public value;
    uint public commision;
    bool public fundsDisbursed;
    mapping (address => bool) releaseAmount;
    uint public releaseCount;
    mapping (address => bool) refundAmount;
    uint public refundCount;

    event CreateEscrow(uint _productId, address _buyer, address _seller, address _arbiter);
    event UnlockAmount(uint _productId, string _operation, address _operator);
    event DisburseAmount(uint _productId, uint _amount, address _beneficiary);

    function Escrow(uint _productId, address _buyer, address _seller, address _arbiter, uint _value, uint _commision) payable public {
        productId = _productId;
        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
        fundsDisbursed = false;
        commision = _commision;
        value = _value;

        CreateEscrow(_productId, _buyer, _seller, _arbiter);
    }

    function escrowInfo() public view returns (address, address, address, bool, uint, uint) {
        return (buyer, seller, arbiter, fundsDisbursed, releaseCount, refundCount);
    }

    function releaseAmountToSeller(address caller) public {
        require(!fundsDisbursed);
        if ((caller == buyer || caller == seller || caller == arbiter) && releaseAmount[caller] != true) {
            releaseAmount[caller] = true;
            releaseCount += 1;
            UnlockAmount(productId, "release", caller);
        }

        if (releaseCount == 2) {
            seller.transfer(value);
            arbiter.transfer(commision);
            fundsDisbursed = true;
            DisburseAmount(productId, value, seller);
        }
    }

    function refundAmountToBuyer(address caller) public {
        require(!fundsDisbursed);
        if ((caller == buyer || caller == seller || caller == arbiter) && refundAmount[caller] != true) {
            refundAmount[caller] = true;
            refundCount += 1;
            UnlockAmount(productId, "refund", caller);
        }

        if (refundCount == 2) {
            buyer.transfer(SafeMath.add(value, commision));
            fundsDisbursed = true;
            DisburseAmount(productId, value, buyer);
        }
    }
}