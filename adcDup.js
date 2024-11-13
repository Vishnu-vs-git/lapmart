
      // Confirm Block Coupon
      async function confirmBlock(couponId) {
        Swal.fire({
          title: "Are you sure you want to block this coupon?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, block it!",
          cancelButtonText: "No",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const response = await axios.post("/admin/couponstatusblock", {
                couponId,
              });
              if (response.data.success) {
                Swal.fire(
                  "Blocked!",
                  "Coupon has been blocked.",
                  "success"
                ).then(() => {
                  // Reloads the page to reflect changes
                  window.location.reload();
                });
              } else {
                Swal.fire("Error", response.data.message, "error");
              }
            } catch (error) {
              console.error(error);
              Swal.fire(
                "Error",
                "An error occurred while blocking the coupon.",
                "error"
              );
            }
          }
        });
      }

     

      // Confirm Unblock Coupon
      async function confirmUnblock(couponId) {
        Swal.fire({
          title: "Are you sure you want to unblock this coupon?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, unblock it!",
          cancelButtonText: "No",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const response = await axios.post("/admin/couponstatusUnblock", {
                couponId,
              });
              if (response.data.success) {
                Swal.fire(
                  "Unblocked!",
                  "Coupon has been unblocked.",
                  "success"
                ).then(() => {
                  // Reloads the page to reflect changes
                  window.location.reload();
                });
              } else {
                Swal.fire("Error", response.data.message, "error");
              }
            } catch (error) {
              console.error(error);
              Swal.fire(
                "Error",
                "An error occurred while unblocking the coupon.",
                "error"
              );
            }
          }
        });
      }