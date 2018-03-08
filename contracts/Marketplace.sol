pragma solidity ^0.4.18;
import "./Escrow.sol";


contract Marketplace {
    address owner;
    enum Status { Unsold, Sold }
    enum ProductCondition { New, Used }

    uint public productIndex;
    mapping (address => mapping(uint => Product)) private stores;
    mapping (uint => address) private productIdInStore;
    mapping (uint => address) productEscrow;

    event NewProduct(uint _productId, string _name, string _category, string _imageLink, string _descLink, uint _price, uint _productCondition);

    struct Product {
        uint id;
        string name;
        string category;
        string imageLink;
        string descLink;
        uint price;
        Status status;
        address sellerAddr;
        string sellerContact;
        address buyerAddr;
        string buyerContact;
        ProductCondition condition;
    }

    function Marketplace() public {
        productIndex = 0;
        owner = msg.sender;
    }

    function addProductToStore(
        string _name, 
        string _category, 
        string _imageLink, 
        string _descLink, 
        uint _price, 
        string _sellerContact,
        uint _productCondition) public {
        require(address(0x0) != msg.sender);
        require(_price > 0);
        productIndex += 1;
        Product memory product = Product(
            productIndex, 
            _name, 
            _category,
            _imageLink, 
            _descLink, 
            _price, 
            Status.Unsold, 
            msg.sender, 
            _sellerContact,
            address(0x0),
            "",
            ProductCondition(_productCondition)
        );
        stores[msg.sender][productIndex] = product;
        productIdInStore[productIndex] = msg.sender;
        NewProduct(productIndex, _name, _category, _imageLink, _descLink, _price, _productCondition);
    }

    function getProduct(uint _productId) public view returns (uint, string, string, string, string, uint, Status, ProductCondition) {
        Product memory product = stores[productIdInStore[_productId]][_productId];
        return (product.id, product.name, product.category, product.imageLink, product.descLink, product.price, product.status, product.condition);
    }

    function buy(uint _productId, string _buyerContact) public payable returns (bool) {
        Product storage product = stores[productIdInStore[_productId]][_productId];
        require(msg.value == product.price);
        require(product.status == Status.Unsold);
        require(address(0x0) != msg.sender);
        product.status = Status.Sold;
        product.buyerAddr = msg.sender;
        product.buyerContact = _buyerContact;
        finalize(_productId);
        return true;
    }

    function escrowAddressForProduct(uint _productId) public view returns (address) {
        return productEscrow[_productId];
    }

    function escrowInfo(uint _productId) public view returns (address, address, address, bool, uint, uint) {
        return Escrow(productEscrow[_productId]).escrowInfo();
    }

    function releaseAmountToSeller(uint _productId) public {
        Escrow(productEscrow[_productId]).releaseAmountToSeller(msg.sender);
    }

    function refundAmountToBuyer(uint _productId) public {
        Escrow(productEscrow[_productId]).refundAmountToBuyer(msg.sender);
    }

    function finalize(uint _productId) private {
        Product memory product = stores[productIdInStore[_productId]][_productId];
        require(product.status == Status.Sold);
        require(address(0x0) != product.buyerAddr);

        Escrow escrow = (new Escrow).value(product.price)(_productId, product.buyerAddr, productIdInStore[_productId], owner);
        productEscrow[_productId] = address(escrow);
    }
}
