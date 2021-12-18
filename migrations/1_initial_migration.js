const Game = artifacts.require("GameNFT");
module.exports = function (deployer) {
  deployer.deploy(Game, "Swinness", "SWS", "/", 100);
};
