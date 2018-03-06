pragma solidity ^0.4.18;


contract Marketplace {
    enum Status { Unsold, Sold }
    enum ProductCondition { New, Used }

    uint public productIndex;
    mapping (address => mapping(uint => Product)) private stores;
    mapping (uint => address) private productIdInStore;

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
        ProductCondition condition;
    }

    function Marketplace() public {
        productIndex = 0;
    }

    function addProductToStore(
        string _name, 
        string _category, 
        string _imageLink, 
        string _descLink, 
        uint _price, 
        address _sellerAddr,
        string _sellerContact,
        uint _productCondition) public {
        productIndex += 1;
        Product memory product = Product(
            productIndex, 
            _name, 
            _category,
            _imageLink, 
            _descLink, 
            _price, 
            Status.Unsold, 
            _sellerAddr, 
            _sellerContact,
            ProductCondition(_productCondition)
        );
        stores[msg.sender][productIndex] = product;
        productIdInStore[productIndex] = msg.sender;
    }

    function getProduct(uint _productId) public view returns (uint, string, string, string, string, uint, Status, ProductCondition) {
        Product memory product = stores[productIdInStore[_productId]][_productId];
        return (product.id, product.name, product.category, product.imageLink, product.descLink, product.price, product.status, product.condition);
    }
}