// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title FreelancePay
 * @dev Decentralized freelance payment platform on Celo with escrow and dispute resolution
 */
contract FreelancePay is Ownable, ReentrancyGuard, Pausable {
    
    // Supported Celo stablecoins
    IERC20 public cUSD;
    IERC20 public cEUR;
    IERC20 public cKES;
    
    // Platform fee (in basis points: 250 = 2.5%)
    uint256 public platformFee = 250;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Payment status
    enum PaymentStatus { 
        Created, 
        Funded, 
        Completed, 
        Disputed, 
        Refunded, 
        Cancelled 
    }
    
    // Payment structure
    struct Payment {
        uint256 id;
        address client;
        address freelancer;
        address token; // cUSD, cEUR, or cKES
        uint256 amount;
        uint256 platformFeeAmount;
        PaymentStatus status;
        string description;
        uint256 createdAt;
        uint256 completedAt;
        bool disputeResolved;
    }
    
    // Freelancer profile
    struct FreelancerProfile {
        string name;
        string skills;
        uint256 totalEarned;
        uint256 completedJobs;
        uint256 rating; // Out of 100
        uint256 totalRatings;
        bool isActive;
    }
    
    // Client profile
    struct ClientProfile {
        string companyName;
        uint256 totalSpent;
        uint256 projectsPosted;
        bool isVerified;
    }
    
    // Storage
    mapping(uint256 => Payment) public payments;
    mapping(address => FreelancerProfile) public freelancers;
    mapping(address => ClientProfile) public clients;
    mapping(uint256 => mapping(address => bool)) public hasRated;
    
    uint256 public paymentCounter;
    uint256 public totalFeesCollected;
    
    // Events
    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed client,
        address indexed freelancer,
        address token,
        uint256 amount
    );
    
    event PaymentFunded(uint256 indexed paymentId, uint256 amount);
    event PaymentCompleted(uint256 indexed paymentId, uint256 amount);
    event PaymentRefunded(uint256 indexed paymentId, uint256 amount);
    event DisputeRaised(uint256 indexed paymentId, address raisedBy);
    event DisputeResolved(uint256 indexed paymentId, address winner);
    event FreelancerRated(uint256 indexed paymentId, address indexed freelancer, uint256 rating);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    constructor(
        address _cUSD,
        address _cEUR,
        address _cKES
    ) Ownable(msg.sender) {
        require(_cUSD != address(0), "Invalid cUSD address");
        require(_cEUR != address(0), "Invalid cEUR address");
        require(_cKES != address(0), "Invalid cKES address");
        
        cUSD = IERC20(_cUSD);
        cEUR = IERC20(_cEUR);
        cKES = IERC20(_cKES);
    }
    
    /**
     * @dev Create a new payment (escrow)
     */
    function createPayment(
        address _freelancer,
        address _token,
        uint256 _amount,
        string memory _description
    ) external whenNotPaused returns (uint256) {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_freelancer != msg.sender, "Cannot pay yourself");
        require(_amount > 0, "Amount must be greater than 0");
        require(
            _token == address(cUSD) || _token == address(cEUR) || _token == address(cKES),
            "Unsupported token"
        );
        
        paymentCounter++;
        
        uint256 feeAmount = (_amount * platformFee) / FEE_DENOMINATOR;
        
        payments[paymentCounter] = Payment({
            id: paymentCounter,
            client: msg.sender,
            freelancer: _freelancer,
            token: _token,
            amount: _amount,
            platformFeeAmount: feeAmount,
            status: PaymentStatus.Created,
            description: _description,
            createdAt: block.timestamp,
            completedAt: 0,
            disputeResolved: false
        });
        
        // Update client profile
        if (bytes(clients[msg.sender].companyName).length == 0) {
            clients[msg.sender].companyName = "New Client";
        }
        clients[msg.sender].projectsPosted++;
        
        // Initialize freelancer if new
        if (bytes(freelancers[_freelancer].name).length == 0) {
            freelancers[_freelancer].name = "Freelancer";
            freelancers[_freelancer].isActive = true;
        }
        
        emit PaymentCreated(paymentCounter, msg.sender, _freelancer, _token, _amount);
        
        return paymentCounter;
    }
    
    /**
     * @dev Fund the payment (transfer to escrow)
     */
    function fundPayment(uint256 _paymentId) external nonReentrant whenNotPaused {
        Payment storage payment = payments[_paymentId];
        
        require(payment.id != 0, "Payment does not exist");
        require(payment.client == msg.sender, "Only client can fund");
        require(payment.status == PaymentStatus.Created, "Payment already funded");
        
        IERC20 token = IERC20(payment.token);
        uint256 totalAmount = payment.amount + payment.platformFeeAmount;
        
        require(
            token.transferFrom(msg.sender, address(this), totalAmount),
            "Transfer failed"
        );
        
        payment.status = PaymentStatus.Funded;
        
        emit PaymentFunded(_paymentId, payment.amount);
    }
    
    /**
     * @dev Complete payment and release funds to freelancer
     */
    function completePayment(uint256 _paymentId) external nonReentrant whenNotPaused {
        Payment storage payment = payments[_paymentId];
        
        require(payment.id != 0, "Payment does not exist");
        require(payment.client == msg.sender, "Only client can complete");
        require(payment.status == PaymentStatus.Funded, "Payment not funded");
        
        IERC20 token = IERC20(payment.token);
        
        // Transfer amount to freelancer
        require(token.transfer(payment.freelancer, payment.amount), "Transfer to freelancer failed");
        
        // Collect platform fee
        totalFeesCollected += payment.platformFeeAmount;
        
        payment.status = PaymentStatus.Completed;
        payment.completedAt = block.timestamp;
        
        // Update profiles
        clients[payment.client].totalSpent += payment.amount;
        freelancers[payment.freelancer].totalEarned += payment.amount;
        freelancers[payment.freelancer].completedJobs++;
        
        emit PaymentCompleted(_paymentId, payment.amount);
    }
    
    /**
     * @dev Raise a dispute
     */
    function raiseDispute(uint256 _paymentId) external whenNotPaused {
        Payment storage payment = payments[_paymentId];
        
        require(payment.id != 0, "Payment does not exist");
        require(
            msg.sender == payment.client || msg.sender == payment.freelancer,
            "Not authorized"
        );
        require(payment.status == PaymentStatus.Funded, "Invalid status for dispute");
        
        payment.status = PaymentStatus.Disputed;
        
        emit DisputeRaised(_paymentId, msg.sender);
    }
    
    /**
     * @dev Resolve dispute (only owner/admin)
     */
    function resolveDispute(
        uint256 _paymentId,
        address _winner,
        uint256 _clientAmount,
        uint256 _freelancerAmount
    ) external onlyOwner nonReentrant {
        Payment storage payment = payments[_paymentId];
        
        require(payment.status == PaymentStatus.Disputed, "Not in dispute");
        require(
            _winner == payment.client || _winner == payment.freelancer,
            "Invalid winner"
        );
        require(
            _clientAmount + _freelancerAmount <= payment.amount,
            "Invalid split amounts"
        );
        
        IERC20 token = IERC20(payment.token);
        
        // Transfer funds according to resolution
        if (_freelancerAmount > 0) {
            require(
                token.transfer(payment.freelancer, _freelancerAmount),
                "Transfer to freelancer failed"
            );
        }
        
        if (_clientAmount > 0) {
            require(
                token.transfer(payment.client, _clientAmount),
                "Transfer to client failed"
            );
        }
        
        // Collect platform fee
        totalFeesCollected += payment.platformFeeAmount;
        
        payment.status = PaymentStatus.Completed;
        payment.disputeResolved = true;
        payment.completedAt = block.timestamp;
        
        emit DisputeResolved(_paymentId, _winner);
    }
    
    /**
     * @dev Cancel payment and refund client (only if not funded)
     */
    function cancelPayment(uint256 _paymentId) external whenNotPaused {
        Payment storage payment = payments[_paymentId];
        
        require(payment.id != 0, "Payment does not exist");
        require(payment.client == msg.sender, "Only client can cancel");
        require(payment.status == PaymentStatus.Created, "Cannot cancel funded payment");
        
        payment.status = PaymentStatus.Cancelled;
    }
    
    /**
     * @dev Refund payment (before completion)
     */
    function refundPayment(uint256 _paymentId) external nonReentrant whenNotPaused {
        Payment storage payment = payments[_paymentId];
        
        require(payment.id != 0, "Payment does not exist");
        require(payment.status == PaymentStatus.Funded, "Payment not in refundable state");
        require(
            msg.sender == payment.client || msg.sender == owner(),
            "Not authorized"
        );
        
        IERC20 token = IERC20(payment.token);
        uint256 refundAmount = payment.amount + payment.platformFeeAmount;
        
        require(token.transfer(payment.client, refundAmount), "Refund failed");
        
        payment.status = PaymentStatus.Refunded;
        
        emit PaymentRefunded(_paymentId, refundAmount);
    }
    
    /**
     * @dev Rate freelancer after job completion
     */
    function rateFreelancer(uint256 _paymentId, uint256 _rating) external {
        Payment storage payment = payments[_paymentId];
        
        require(payment.id != 0, "Payment does not exist");
        require(payment.client == msg.sender, "Only client can rate");
        require(payment.status == PaymentStatus.Completed, "Payment not completed");
        require(!hasRated[_paymentId][msg.sender], "Already rated");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        
        FreelancerProfile storage profile = freelancers[payment.freelancer];
        
        // Convert rating to 100 scale
        uint256 ratingScore = _rating * 20;
        
        // Calculate new average rating
        profile.rating = ((profile.rating * profile.totalRatings) + ratingScore) / 
                        (profile.totalRatings + 1);
        profile.totalRatings++;
        
        hasRated[_paymentId][msg.sender] = true;
        
        emit FreelancerRated(_paymentId, payment.freelancer, _rating);
    }
    
    /**
     * @dev Update freelancer profile
     */
    function updateFreelancerProfile(
        string memory _name,
        string memory _skills
    ) external {
        freelancers[msg.sender].name = _name;
        freelancers[msg.sender].skills = _skills;
        freelancers[msg.sender].isActive = true;
    }
    
    /**
     * @dev Update client profile
     */
    function updateClientProfile(string memory _companyName) external {
        clients[msg.sender].companyName = _companyName;
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high (max 10%)");
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        
        emit PlatformFeeUpdated(oldFee, _newFee);
    }
    
    /**
     * @dev Withdraw collected fees (only owner)
     */
    function withdrawFees(address _token, address _to) external onlyOwner nonReentrant {
        require(_to != address(0), "Invalid address");
        require(
            _token == address(cUSD) || _token == address(cEUR) || _token == address(cKES),
            "Unsupported token"
        );
        
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        
        // Calculate available fees (total balance minus active payments)
        uint256 availableFees = balance;
        
        require(availableFees > 0, "No fees to withdraw");
        require(token.transfer(_to, availableFees), "Transfer failed");
        
        emit FeesWithdrawn(_to, availableFees);
    }
    
    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get payment details
     */
    function getPayment(uint256 _paymentId) external view returns (Payment memory) {
        return payments[_paymentId];
    }
    
    /**
     * @dev Get freelancer profile
     */
    function getFreelancerProfile(address _freelancer) 
        external 
        view 
        returns (FreelancerProfile memory) 
    {
        return freelancers[_freelancer];
    }
    
    /**
     * @dev Get client profile
     */
    function getClientProfile(address _client) 
        external 
        view 
        returns (ClientProfile memory) 
    {
        return clients[_client];
    }
}