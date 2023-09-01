import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ClipLoader } from "react-spinners";
import Select from "react-select";

import "./styles/FaucetForm.css";
import FooterBox from "./FooterBox";
import queryString from "query-string";
import { DropdownOption } from "./types";
import { connectAccount } from "./Metamask";
import { AxiosResponse } from "axios";

const FaucetForm = (props: any) => {
  const [chain, setChain] = useState<number | null>(null);
  const [token, setToken] = useState<number | null>(null);
  const [chainConfigs, setChainConfigs] = useState<any>([]);
  const [inputAddress, setInputAddress] = useState<string>("");
  const [address, setAddress] = useState<string | null>(null);
  const [faucetAddress, setFaucetAddress] = useState<string | null>(null);
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [tokenOptions, setTokenOptions] = useState<DropdownOption[]>([]);
  const [shouldAllowSend, setShouldAllowSend] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sendTokenResponse, setSendTokenResponse] = useState<any>({
    txHash: null,
    message: null,
  });

  const [verificationStatus, setVerificationStatus] = useState<{
    err: boolean;
    verified: boolean;
    hashedName: string;
  }>({
    err: false,
    verified: false,
    hashedName: ethers.utils.id(""),
  });

  const [twitterLink, setTwitterLink] = useState<string>("");

  const preWrittenTweet =
    "Excited to mint @reserveprotocol RTokens on @BuildOnBase! \n \nGrabbing myself some free faucet funds at https://faucet.reserve.org";

  // Update chain configs
  useEffect(() => {
    updateChainConfigs();
    connectAccount(updateAddress, false);
  }, []);

  // Make REQUEST button disabled if either address is not valid or balance is low
  useEffect(() => {
    if (address && verificationStatus.verified) {
      setShouldAllowSend(true);
      return;
    }

    setShouldAllowSend(false);
  }, [address, verificationStatus]);

  useEffect(() => {
    updateFaucetAddress();
  }, [chain, chainConfigs]);

  useEffect(() => {
    let newOptions: DropdownOption[] = [];

    chainConfigs?.forEach((chain: any, i: number) => {
      let item = (
        <div className="select-dropdown">
          <img alt={chain.NAME[0]} src={chain.IMAGE} />
          {chain.NAME}

          {chain.CONTRACTADDRESS && (
            <span
              style={{
                color: "rgb(180, 180, 183)",
                fontSize: "10px",
                marginLeft: "5px",
              }}
            >
              {chainConfigs[chainToIndex(chain.HOSTID) || 0]?.NAME}
            </span>
          )}
        </div>
      );

      if (!chain.CONTRACTADDRESS) {
        newOptions.push({
          label: item,
          value: i,
          search: chain.NAME,
        });
      }
    });

    setOptions(newOptions);
    setChain(newOptions[0]?.value);
  }, [chainConfigs]);

  useEffect(() => {
    let newOptions: DropdownOption[] = [];

    chainConfigs?.forEach((chain: any, i: number) => {
      const { chain: ch } = getChainParams();

      let item = (
        <div className="select-dropdown">
          <img alt={chain.NAME[0]} src={chain.IMAGE} />
          <strong>
            {chain.ID == ch ? chain.TOKEN : `${chain.DRIP_AMOUNT}`}{" "}
          </strong>{" "}
          &nbsp;
          <a
            target={"_blank"}
            href={chain.EXPLORER + "/address/" + chain.CONTRACTADDRESS}
            rel="noreferrer"
          >
            {chain.NAME}{" "}
          </a>
          <span
            style={{
              color: "rgb(180, 180, 183)",
              fontSize: "10px",
              marginLeft: "5px",
            }}
          >
            {chain.CONTRACTADDRESS ? "ERC20" : "Native"}
          </span>
        </div>
      );

      if ((chain.CONTRACTADDRESS && chain.HOSTID == ch) || chain.ID == ch) {
        newOptions.push({
          label: item,
          value: i,
          search: chain.NAME,
        });
      }
    });

    setTokenOptions(newOptions.slice(1));
    setToken(newOptions[0]?.value);
  }, [chainConfigs, chain]);

  const getConfigByTokenAndNetwork = (token: any, network: any): number => {
    let selectedConfig = 0;

    try {
      token = token?.toUpperCase();
      network = network?.toUpperCase();

      chainConfigs.forEach((chain: any, i: number): any => {
        if (chain.TOKEN == token && chain.HOSTID == network) {
          selectedConfig = i;
        }
      });
    } catch (err: any) {
      console.log(err);
    }

    return selectedConfig;
  };

  let totalTokens: boolean = tokenOptions?.length === 0;

  useEffect(() => {
    const query = queryString.parse(window.location.search);

    const { address, subnet, erc20 } = query;

    const tokenIndex: number = getConfigByTokenAndNetwork(erc20, subnet);

    if (typeof address == "string") {
      updateAddress(address);
    }

    if (typeof subnet == "string") {
      setChain(chainToIndex(subnet));
      if (typeof erc20 == "string") {
        setToken(tokenIndex);
      }
    } else {
      setChain(0);
    }
  }, [window.location.search, options, totalTokens]);

  // API calls
  async function updateChainConfigs(): Promise<void> {
    const response: AxiosResponse = await props.axios.get(
      props.config.api.getChainConfigs
    );
    setChainConfigs(response?.data?.configs);
  }

  function getChainParams(): { chain: string; erc20: string } {
    let params = {
      chain: chainConfigs[chain!]?.ID,
      erc20: chainConfigs[token!]?.ID,
    };

    return params;
  }

  async function updateFaucetAddress(): Promise<void> {
    if ((chain || chain == 0) && chainConfigs.length > 0) {
      let { chain } = getChainParams();

      const response: AxiosResponse = await props.axios.get(
        props.config.api.faucetAddress,
        {
          params: {
            chain,
          },
        }
      );

      if (response?.data) {
        setFaucetAddress(response?.data?.address);
      }
    }
  }

  function calculateBaseUnit(
    amount: string = "0",
    decimals: number = 18
  ): BigInt {
    for (let i = 0; i < decimals; i++) {
      amount += "0";
    }
    return BigInt(amount);
  }

  function chainToIndex(id: any): number | null {
    if (chainConfigs?.length > 0) {
      if (typeof id == "string") {
        id = id.toUpperCase();
      }
      let index: number = 0;
      chainConfigs.forEach((chain: any, i: number) => {
        if (id == chain.ID) {
          index = i;
        }
      });
      return index;
    } else {
      return null;
    }
  }

  function updateAddress(addr: any): void {
    setInputAddress(addr!);

    if (addr) {
      if (ethers.utils.isAddress(addr)) {
        setAddress(addr);
      } else {
        setAddress(null);
      }
    } else if (address != null) {
      setAddress(null);
    }
  }

  function updateChain(option: any): void {
    let chainNum: number = option.value;

    if (chainNum >= 0 && chainNum < chainConfigs.length) {
      setChain(chainNum);
      back();
    }
  }

  async function sendToken(): Promise<void> {
    if (!shouldAllowSend) {
      return;
    }
    let data: any;
    try {
      setIsLoading(true);

      let { chain, erc20 } = getChainParams();

      const response = await props.axios.post(props.config.api.sendToken, {
        address,
        token,
        hashedName: verificationStatus.hashedName,
        chain,
        erc20,
      });
      data = response?.data;
    } catch (err: any) {
      data = err?.response?.data || err;
    }

    setSendTokenResponse({
      txHash: data?.txHash,
      message: data?.message,
    });

    setIsLoading(false);
  }

  const getOptionByValue = (value: any): DropdownOption => {
    let selectedOption: DropdownOption = options[0];
    options.forEach((option: DropdownOption): void => {
      if (option.value == value) {
        selectedOption = option;
      }
    });
    return selectedOption;
  };

  const customStyles = {
    control: (base: any, state: { isFocused: any }) => ({
      ...base,
      background: "#333",
      borderRadius: state.isFocused ? "5px 5px 0 0" : 5,
      borderColor: state.isFocused ? "white" : "#333",
      boxShadow: null,
      "&:hover": {
        borderColor: "white",
      },
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: 0,
      marginTop: 0,
      background: "rgb(45, 45, 45)",
      color: "white",
    }),
    menuList: (base: any) => ({
      ...base,
      padding: 0,
      "::-webkit-scrollbar": {
        width: "2px",
      },
      "::-webkit-scrollbar-track": {
        background: "black",
      },
      "::-webkit-scrollbar-thumb": {
        background: "#888",
      },
      "::-webkit-scrollbar-thumb:hover": {
        background: "#555",
      },
    }),
    option: (styles: any, { isFocused, isSelected }: any) => ({
      ...styles,
      background: isFocused ? "black" : isSelected ? "#333" : undefined,
      zIndex: 1,
    }),
    input: (base: any) => ({
      ...base,
      color: "white",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "white",
    }),
  };

  const ChainDropdown = () => (
    <div style={{ width: "100%", marginTop: "5px" }}>
      <Select
        options={options}
        value={getOptionByValue(chain)}
        onChange={updateChain}
        styles={customStyles}
        getOptionValue={(option: any) => option.search}
      />
    </div>
  );

  const back = (): void => {
    setSendTokenResponse({
      txHash: null,
      message: null,
    });
  };

  const handleTweet = () => {
    const tweetLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      preWrittenTweet
    )}`;
    window.open(tweetLink, "_blank");
  };

  const verifyTweet = async () => {
    setVerificationStatus({
      err: false,
      verified: false,
      hashedName: ethers.utils.id(""),
    });

    try {
      const response = await props.axios.post(props.config.api.verifyTweet, {
        tweetLink: twitterLink,
        preWrittenTweet,
      });

      if (response.data.verified) {
        const urlObj = new URL(twitterLink);
        const pathSegments = urlObj.pathname.split("/");
        const userName = pathSegments[pathSegments.length - 3];

        setVerificationStatus({
          err: false,
          verified: true,
          hashedName: ethers.utils.id(userName),
        });
      } else {
        setVerificationStatus({
          err: true,
          verified: false,
          hashedName: ethers.utils.id(""),
        });
      }
    } catch (error) {
      console.error("Error verifying tweet:", error);
    }
  };
  return (
    <div className="container">
      <div className="box">
        <div
          className="banner"
          style={{ backgroundImage: `url(${props.config.banner})` }}
        />
        <div className="box-content">
          <div>
            <p className="tweet-step-instruction">
              Step 1: Tweet the following content:
            </p>
            <button onClick={handleTweet} className="tweet-button">
              Tweet
            </button>
          </div>
          <div>
            <p className="tweet-step-instruction">
              Step 2: Paste the link to your tweet to verify:
            </p>
            <div className="address-input">
              <input
                type="text"
                value={twitterLink}
                onChange={(e) => setTwitterLink(e.target.value)}
                placeholder="Tweet link..."
                className="twitter-link-input"
              />
            </div>
            <button
              disabled={
                !/http(?:s)?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/.test(
                  twitterLink
                )
              }
              onClick={verifyTweet}
              className="verify-button"
            >
              Verify
            </button>
            {verificationStatus.err && (
              <span className="rate-limit-text" style={{ color: "red" }}>
                Error verifying Tweet
              </span>
            )}
            {!verificationStatus.err && verificationStatus.verified && (
              <span className="rate-limit-text" style={{ color: "#08da08" }}>
                Successfully verified Tweet
              </span>
            )}
          </div>
        </div>
        <div className="box-content">
          <div className="box-header">
            <span>
              <span style={{ color: "#f9eddd" }}>Select Network</span>
            </span>
            <ChainDropdown /> <br />
            <div>
              <div style={{ width: "100%" }}>
                <span style={{ color: "#f9eddd", fontSize: "13px" }}>
                  Faucet Provides:{" "}
                </span>

                {tokenOptions.map((token) => {
                  return (
                    <div
                      style={{
                        display: "flex",
                        color: "white",
                        paddingTop: "0.3rem",
                      }}
                    >
                      {token.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <br />

          <div
            style={{ display: sendTokenResponse?.txHash ? "none" : "block" }}
          >
            <div className="address-input">
              <input
                placeholder="Hexadecimal Address (0x...)"
                value={inputAddress || ""}
                onChange={(e) => updateAddress(e.target.value)}
                autoFocus
              />

              <span
                className="connect-metamask"
                onClick={() => connectAccount(updateAddress)}
              >
                <img alt="metamask" src="/memtamask.webp" />
                Connect
              </span>
            </div>
            <span className="rate-limit-text" style={{ color: "red" }}>
              {sendTokenResponse?.message}
            </span>

            <button
              className={
                shouldAllowSend ? "send-button" : "send-button-disabled"
              }
              disabled={!shouldAllowSend}
              onClick={sendToken}
            >
              {isLoading ? (
                <ClipLoader size="20px" speedMultiplier={0.3} color="403F40" />
              ) : (
                <span>Request Funds</span>
              )}
            </button>
          </div>

          <div
            style={{ display: sendTokenResponse?.txHash ? "block" : "none" }}
          >
            <p className="rate-limit-text">{sendTokenResponse?.message}</p>

            <div>
              <span className="bold-text">Transaction ID</span>
              <p className="rate-limit-text">
                <a
                  target={"_blank"}
                  href={
                    chainConfigs[token!]?.EXPLORER +
                    "/tx/" +
                    sendTokenResponse?.txHash
                  }
                  rel="noreferrer"
                >
                  {sendTokenResponse?.txHash}
                </a>
              </p>
            </div>

            <button className="back-button" onClick={back}>
              Back
            </button>
          </div>
        </div>
      </div>

      <FooterBox
        chain={chain}
        token={token}
        chainConfigs={chainConfigs}
        chainToIndex={chainToIndex}
        faucetAddress={faucetAddress}
      />
    </div>
  );
};

export default FaucetForm;
