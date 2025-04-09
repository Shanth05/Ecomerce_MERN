import React from "react";

const Header = () => {
    return (
        <header className='h-20 shadow-md sticky top-0'>
            {/**logo*/}
            <div>
                <div>
                    <img 
                    src={logo}
                    width={120}
                    height={60}
                    alt='logo'
                />
                </div>
            </div>
             {/**Search */}

             {/**login and my cart */}
        </header>
    )
}

export default Header