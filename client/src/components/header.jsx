import React from "react";

const Header = () => {
    return (
        <header className='h-20 shadow-md sticky top-0'>
            <div className="container mx-auto items-center h-full">
                    {/**logo*/}
                    <div className="h-full">            
                        <div className="h-full bg-red-500 flex justify-center items-center">
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
            </div>
        </header>
    )
}

export default Header